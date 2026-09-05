const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const { rabInclude, withSummary, summarizeRab, summarizeAccount, audit, treasurerRoles } = require('../services/keuangan.service');
const { assertUnusedQr } = require('./rekonsiliasi.controller');

const { prisma } = require('../services/finance-db');
const asInt = (value) => Number.parseInt(value, 10);
const asBigInt = (value) => value ? BigInt(value) : null;
const asMoney = (value) => {
  const result = Math.round(Number(value || 0));
  if (!Number.isSafeInteger(result)) throw new Error('Nominal tidak valid');
  return result;
};
const isTreasurer = (user) => treasurerRoles.includes(user.role);
const parseItems = (value) => typeof value === 'string' ? JSON.parse(value) : value;
const safeFilePath = (file) => file ? `/uploads/${file.filename}` : null;

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const getSignerData = (body) => {
  const signer = {
    namaPejabat: body.namaPejabat?.trim(),
    jabatan: body.jabatan?.trim(),
    namaPejabat2: body.namaPejabat2?.trim(),
    jabatan2: body.jabatan2?.trim()
  };
  if (Object.values(signer).some((value) => !value)) throw new Error('Nama dan jabatan kedua penandatangan wajib diisi');
  return signer;
};

const createVerificationDocument = async (tx, { nomorSurat, keteranganSurat, signer }) => {
  let token;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = crypto.randomBytes(4).toString('hex').toUpperCase();
    if (!await tx.qrDocument.findUnique({ where: { token: candidate } })) {
      token = candidate;
      break;
    }
  }
  if (!token) throw new Error('Gagal membuat token verifikasi dokumen');
  return tx.qrDocument.create({
    data: {
      id: BigInt(Date.now()) * 1000n + BigInt(crypto.randomInt(1000)),
      token,
      nomorSurat,
      keteranganSurat,
      tanggal: new Date(),
      ...signer
    }
  });
};

const validateRabVerificationDocument = async (value, currentRabId = null) => {
  if (!value) return null;
  let id;
  try { id = asBigInt(value); } catch { throw new Error('QR-Code verifikasi tidak valid'); }
  const document = await prisma.qrDocument.findUnique({
    where: { id },
    include: { rabApproval: { select: { id: true } } }
  });
  if (!document) throw new Error('QR-Code verifikasi tidak ditemukan');
  await assertUnusedQr(prisma, id);
  if (document.rabApproval && document.rabApproval.id !== currentRabId) throw new Error('QR-Code verifikasi sudah digunakan oleh RAB lain');
  return id;
};

const resolveRabVerificationDocument = async ({ id, token, currentRabId = null }) => {
  if (id) return validateRabVerificationDocument(id, currentRabId);
  if (!token) return null;

  const document = await prisma.qrDocument.findUnique({
    where: { token: String(token).trim().toUpperCase() },
    include: { rabApproval: { select: { id: true } } }
  });
  if (!document) throw new Error('QR-Code verifikasi tidak ditemukan');
  await assertUnusedQr(prisma, document.id);
  if (document.rabApproval && document.rabApproval.id !== currentRabId) {
    throw new Error('QR-Code verifikasi sudah digunakan oleh RAB lain');
  }
  return document.id;
};

const validateLpjVerificationDocument = async (value, currentRabId = null) => {
  if (!value) return null;
  let id;
  try { id = asBigInt(value); } catch { throw new Error('QR-Code verifikasi tidak valid'); }
  const document = await prisma.qrDocument.findUnique({
    where: { id },
    include: { lpjApproval: { select: { id: true } } }
  });
  if (!document) throw new Error('QR-Code verifikasi tidak ditemukan');
  await assertUnusedQr(prisma, id);
  if (document.lpjApproval && document.lpjApproval.id !== currentRabId) throw new Error('QR-Code verifikasi sudah digunakan oleh LPJ lain');
  return id;
};

const resolveLpjVerificationDocument = async ({ id, token, currentRabId = null }) => {
  if (id) return validateLpjVerificationDocument(id, currentRabId);
  if (!token) return null;

  const document = await prisma.qrDocument.findUnique({
    where: { token: String(token).trim().toUpperCase() },
    include: { lpjApproval: { select: { id: true } } }
  });
  if (!document) throw new Error('QR-Code verifikasi tidak ditemukan');
  await assertUnusedQr(prisma, document.id);
  if (document.lpjApproval && document.lpjApproval.id !== currentRabId) {
    throw new Error('QR-Code verifikasi sudah digunakan oleh LPJ lain');
  }
  return document.id;
};

const listVerificationDocuments = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const documents = await prisma.qrDocument.findMany({
      where: search ? { OR: [
        { token: { contains: search, mode: 'insensitive' } },
        { nomorSurat: { contains: search, mode: 'insensitive' } },
        { keteranganSurat: { contains: search, mode: 'insensitive' } },
        { namaPejabat: { contains: search, mode: 'insensitive' } },
        { namaPejabat2: { contains: search, mode: 'insensitive' } }
      ] } : undefined,
      include: {
        rabApproval: { select: { id: true, nomorRab: true, namaKegiatan: true } },
        lpjApproval: { select: { id: true, nomorRab: true, namaKegiatan: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 250
    });
    const archived = await prisma.arsipLpj.findMany({ select: { snapshot: true } });
    const reserved = new Set(archived.flatMap(a => [a.snapshot.rabQrDocumentId, a.snapshot.lpjQrDocumentId]).filter(Boolean));
    res.json({ success: true, data: documents.map((document) => ({
      ...document,
      id: document.id.toString(),
      tersedia: !document.rabApproval && !document.lpjApproval && !reserved.has(document.id.toString())
    })) });
  } catch (error) {
    console.error('List Finance Verification Documents Error:', error);
    fail(res, 500, 'Gagal memuat daftar QR-Code verifikasi');
  }
};

const generateRabNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `RAB/${year}/${month}/`;
  const count = await prisma.rencanaAnggaran.count({ where: { nomorRab: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

const normalizeItem = (item, index, approved = false) => {
  const volume = Number(item.volume);
  const hargaSatuan = asMoney(item.hargaSatuan);
  if (!item.uraian?.trim() || !Number.isFinite(volume) || volume <= 0 || hargaSatuan <= 0 || !item.satuan?.trim()) {
    throw new Error(`Item anggaran baris ${index + 1} belum valid`);
  }
  const jumlahDiajukan = Math.round(volume * hargaSatuan);
  return {
    kategoriId: item.kategoriId ? asInt(item.kategoriId) : null,
    uraian: item.uraian.trim(),
    volume,
    satuan: item.satuan.trim(),
    hargaSatuan,
    jumlahDiajukan,
    jumlahDisetujui: approved ? asMoney(item.jumlahDisetujui ?? jumlahDiajukan) : 0,
    urutan: index
  };
};

const getRabOrFail = async (id) => prisma.rencanaAnggaran.findUnique({ where: { id: asInt(id) }, include: rabInclude });

const getDashboard = async (req, res) => {
  try {
    const [rabs, categories] = await Promise.all([
      prisma.rencanaAnggaran.findMany({ include: { pencairans: true, pengeluarans: true, pengembalians: true } }),
      prisma.kategoriKeuangan.findMany({ where: { isAktif: true }, orderBy: { nama: 'asc' } })
    ]);
    const summaries = rabs.map((rab) => ({ rab, summary: summarizeRab(rab) }));
    const statusCounts = rabs.reduce((acc, rab) => ({ ...acc, [rab.status]: (acc[rab.status] || 0) + 1 }), {});
    const categoryTotals = await prisma.pengeluaranRab.groupBy({
      by: ['kategoriId'],
      where: { status: 'VERIFIKASI' },
      _sum: { nominal: true }
    });
    const categoryMap = new Map(categories.map((item) => [item.id, item.nama]));
    res.json({
      success: true,
      data: {
        totalRab: rabs.length,
        totalAnggaranDisetujui: rabs.reduce((t, r) => t + Number(r.totalDisetujui), 0),
        totalDanaMasuk: summaries.reduce((t, r) => t + r.summary.danaMasuk, 0),
        totalDanaBendahara: summaries.reduce((t, r) => t + r.summary.pencairanBendahara, 0),
        totalDanaTambahan: summaries.reduce((t, r) => t + r.summary.danaTambahan, 0),
        totalPenerimaanMenunggu: summaries.reduce((t, r) => t + r.summary.penerimaanMenunggu, 0),
        totalPengeluaran: summaries.reduce((t, r) => t + r.summary.pengeluaranTerverifikasi, 0),
        totalSisaKas: summaries.reduce((t, r) => t + r.summary.sisaKas, 0),
        menungguPersetujuan: statusCounts.DIAJUKAN || 0,
        menungguVerifikasiPengeluaran: await prisma.pengeluaranRab.count({ where: { status: 'MENUNGGU_VERIFIKASI' } }),
        statusCounts,
        pengeluaranPerKategori: categoryTotals.map((row) => ({ kategoriId: row.kategoriId, kategori: categoryMap.get(row.kategoriId) || 'Tanpa Kategori', total: Number(row._sum.nominal || 0) }))
      }
    });
  } catch (error) {
    console.error('Finance Dashboard Error:', error);
    fail(res, 500, 'Gagal memuat statistik keuangan');
  }
};

const listRab = async (req, res) => {
  try {
    const page = Math.max(asInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(asInt(req.query.limit) || 20, 1), 100);
    const where = {
      ...(req.query.status ? { status: req.query.status } : {}),
      ...(req.query.search ? { OR: [
        { nomorRab: { contains: req.query.search, mode: 'insensitive' } },
        { nomorReferensi: { contains: req.query.search, mode: 'insensitive' } },
        { namaKegiatan: { contains: req.query.search, mode: 'insensitive' } },
        { penanggungJawab: { contains: req.query.search, mode: 'insensitive' } }
      ] } : {})
    };
    const [total, rows] = await Promise.all([
      prisma.rencanaAnggaran.count({ where }),
      prisma.rencanaAnggaran.findMany({
        where,
        include: { programAjahan: true, createdBy: { select: { nama: true } }, pencairans: true, pengeluarans: true, pengembalians: true },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit
      })
    ]);
    res.json({ success: true, data: rows.map(withSummary), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('List RAB Error:', error);
    fail(res, 500, 'Gagal memuat daftar RAB');
  }
};

const getRab = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    const audits = await prisma.auditKeuangan.findMany({
      where: { OR: [
        { entityType: 'RAB', entityId: rab.id },
        { entityType: { in: ['PENCAIRAN', 'PENGELUARAN', 'PENGEMBALIAN'] }, newValue: { path: ['rabId'], equals: rab.id } }
      ] },
      include: { user: { select: { nama: true, role: true } } }, orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: { ...withSummary(rab), audits } });
  } catch (error) {
    console.error('Get RAB Error:', error);
    fail(res, 500, 'Gagal memuat detail RAB');
  }
};

const createRab = async (req, res) => {
  try {
    const items = parseItems(req.body.items);
    if (!Array.isArray(items) || items.length === 0) return fail(res, 400, 'Minimal satu item anggaran wajib diisi');
    if (!req.body.namaKegiatan || !req.body.penanggungJawab || !req.body.tanggalMulai || !req.body.tanggalSelesai) return fail(res, 400, 'Data utama RAB belum lengkap');
    const normalized = items.map((item, index) => normalizeItem(item, index));
    const totalDiajukan = normalized.reduce((total, item) => total + item.jumlahDiajukan, 0);
    const nomorRab = await generateRabNumber();
    const rabQrDocumentId = await validateRabVerificationDocument(req.body.rabQrDocumentId);
    const rab = await prisma.$transaction(async (tx) => {
      const created = await tx.rencanaAnggaran.create({
        data: {
          nomorRab,
          nomorReferensi: req.body.nomorReferensi?.trim() || null,
          rabQrDocumentId,
          namaKegiatan: req.body.namaKegiatan.trim(),
          programAjahanId: req.body.programAjahanId ? asInt(req.body.programAjahanId) : null,
          penanggungJawab: req.body.penanggungJawab.trim(),
          tujuan: req.body.tujuan || null,
          tanggalMulai: new Date(req.body.tanggalMulai),
          tanggalSelesai: new Date(req.body.tanggalSelesai),
          totalDiajukan,
          dokumenPath: safeFilePath(req.file),
          catatan: req.body.catatan || null,
          createdById: req.user.id,
          items: { create: normalized }
        }, include: rabInclude
      });
      await audit(tx, { entityType: 'RAB', entityId: created.id, action: 'DIBUAT', newValue: { nomorRab, totalDiajukan }, userId: req.user.id });
      return created;
    });
    res.status(201).json({ success: true, message: 'Draft RAB berhasil dibuat', data: withSummary(rab) });
  } catch (error) {
    console.error('Create RAB Error:', error);
    fail(res, 400, error.message || 'Gagal membuat RAB');
  }
};

const updateRab = async (req, res) => {
  try {
    const existing = await getRabOrFail(req.params.id);
    if (!existing) return fail(res, 404, 'RAB tidak ditemukan');
    if (!['DRAFT', 'DITOLAK'].includes(existing.status)) return fail(res, 409, 'RAB pada status ini tidak dapat diedit');
    const items = req.body.items ? parseItems(req.body.items).map((item, index) => normalizeItem(item, index)) : null;
    const rabQrDocumentId = req.body.rabQrDocumentId !== undefined
      ? await validateRabVerificationDocument(req.body.rabQrDocumentId, existing.id)
      : undefined;
    const data = {
      ...(req.body.namaKegiatan ? { namaKegiatan: req.body.namaKegiatan.trim() } : {}),
      ...(req.body.nomorReferensi !== undefined ? { nomorReferensi: req.body.nomorReferensi.trim() || null } : {}),
      ...(rabQrDocumentId !== undefined ? { rabQrDocumentId } : {}),
      ...(req.body.penanggungJawab ? { penanggungJawab: req.body.penanggungJawab.trim() } : {}),
      ...(req.body.programAjahanId !== undefined ? { programAjahanId: req.body.programAjahanId ? asInt(req.body.programAjahanId) : null } : {}),
      ...(req.body.tujuan !== undefined ? { tujuan: req.body.tujuan || null } : {}),
      ...(req.body.catatan !== undefined ? { catatan: req.body.catatan || null } : {}),
      ...(req.body.tanggalMulai ? { tanggalMulai: new Date(req.body.tanggalMulai) } : {}),
      ...(req.body.tanggalSelesai ? { tanggalSelesai: new Date(req.body.tanggalSelesai) } : {}),
      ...(req.file ? { dokumenPath: safeFilePath(req.file) } : {}),
      ...(items ? { totalDiajukan: items.reduce((total, item) => total + item.jumlahDiajukan, 0) } : {}),
      status: 'DRAFT', rejectedReason: null
    };
    const updated = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.itemAnggaran.deleteMany({ where: { rabId: existing.id } });
        data.items = { create: items };
      }
      const row = await tx.rencanaAnggaran.update({ where: { id: existing.id }, data, include: rabInclude });
      await audit(tx, { entityType: 'RAB', entityId: existing.id, action: 'DIPERBARUI', oldValue: { status: existing.status, totalDiajukan: Number(existing.totalDiajukan) }, newValue: { status: row.status, totalDiajukan: Number(row.totalDiajukan) }, userId: req.user.id });
      return row;
    });
    res.json({ success: true, message: 'Draft RAB berhasil diperbarui', data: withSummary(updated) });
  } catch (error) {
    console.error('Update RAB Error:', error);
    fail(res, 400, error.message || 'Gagal memperbarui RAB');
  }
};

const updateRabMetadata = async (req, res) => {
  try {
    const existing = await getRabOrFail(req.params.id);
    if (!existing) return fail(res, 404, 'RAB tidak ditemukan');
    if (['SELESAI', 'MENUNGGU_VERIFIKASI_LPJ'].includes(existing.status)) return fail(res, 409, 'Buka penyesuaian sebelum mengubah informasi LPJ selesai');
    if (!req.body.alasanPerubahan?.trim()) return fail(res, 400, 'Alasan perubahan wajib diisi untuk kebutuhan audit');
    if (!req.body.namaKegiatan?.trim() || !req.body.penanggungJawab?.trim() || !req.body.tanggalMulai || !req.body.tanggalSelesai) {
      return fail(res, 400, 'Nama kegiatan, penanggung jawab, dan periode wajib diisi');
    }
    const tanggalMulai = new Date(req.body.tanggalMulai);
    const tanggalSelesai = new Date(req.body.tanggalSelesai);
    if (Number.isNaN(tanggalMulai.getTime()) || Number.isNaN(tanggalSelesai.getTime()) || tanggalSelesai < tanggalMulai) {
      return fail(res, 400, 'Periode kegiatan tidak valid');
    }
    const data = {
      namaKegiatan: req.body.namaKegiatan.trim(),
      nomorReferensi: req.body.nomorReferensi?.trim() || null,
      programAjahanId: req.body.programAjahanId ? asInt(req.body.programAjahanId) : null,
      penanggungJawab: req.body.penanggungJawab.trim(),
      tujuan: req.body.tujuan?.trim() || null,
      tanggalMulai,
      tanggalSelesai,
      catatan: req.body.catatan?.trim() || null
    };
    const oldValue = {
      namaKegiatan: existing.namaKegiatan,
      nomorReferensi: existing.nomorReferensi,
      programAjahanId: existing.programAjahanId,
      penanggungJawab: existing.penanggungJawab,
      tujuan: existing.tujuan,
      tanggalMulai: existing.tanggalMulai,
      tanggalSelesai: existing.tanggalSelesai,
      catatan: existing.catatan
    };
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.rencanaAnggaran.update({ where: { id: existing.id }, data, include: rabInclude });
      await audit(tx, {
        entityType: 'RAB',
        entityId: existing.id,
        action: existing.status === 'SELESAI' ? 'INFORMASI_LPJ_DIPERBARUI' : 'INFORMASI_RAB_DIPERBARUI',
        oldValue,
        newValue: data,
        reason: req.body.alasanPerubahan.trim(),
        userId: req.user.id
      });
      return row;
    });
    res.json({ success: true, message: 'Informasi RAB/LPJ berhasil diperbarui', data: withSummary(updated) });
  } catch (error) {
    console.error('Update RAB Metadata Error:', error);
    fail(res, 400, error.message || 'Gagal memperbarui informasi RAB/LPJ');
  }
};

const submitRab = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (!['DRAFT', 'DITOLAK'].includes(rab.status)) return fail(res, 409, 'RAB tidak dapat diajukan pada status ini');
    if (!rab.items.length || Number(rab.totalDiajukan) <= 0) return fail(res, 400, 'RAB belum memiliki anggaran yang valid');
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'DIAJUKAN', submittedAt: new Date() }, include: rabInclude });
      await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'DIAJUKAN', oldValue: { status: rab.status }, newValue: { status: 'DIAJUKAN' }, userId: req.user.id });
      return row;
    });
    res.json({ success: true, message: 'RAB berhasil diajukan kepada Bendahara', data: withSummary(updated) });
  } catch (error) {
    console.error('Submit RAB Error:', error);
    fail(res, 500, 'Gagal mengajukan RAB');
  }
};

const approveRab = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (rab.status !== 'DIAJUKAN') return fail(res, 409, 'Hanya RAB berstatus diajukan yang dapat disetujui');
    const amounts = new Map((req.body.items || []).map((item) => [asInt(item.id), asMoney(item.jumlahDisetujui)]));
    const approvedItems = rab.items.map((item) => ({ id: item.id, amount: amounts.has(item.id) ? amounts.get(item.id) : Number(item.jumlahDiajukan) }));
    if (approvedItems.some((item) => item.amount < 0)) return fail(res, 400, 'Nilai persetujuan tidak boleh negatif');
    const totalDisetujui = approvedItems.reduce((total, item) => total + item.amount, 0);
    if (totalDisetujui <= 0) return fail(res, 400, 'Total anggaran disetujui harus lebih dari nol');
    const selectedVerificationId = await resolveRabVerificationDocument({
      id: req.body.rabQrDocumentId,
      token: req.body.rabQrDocumentToken,
      currentRabId: rab.id
    }) || rab.rabQrDocumentId;
    const signer = selectedVerificationId ? null : getSignerData(req.body);
    const updated = await prisma.$transaction(async (tx) => {
      await Promise.all(approvedItems.map((item) => tx.itemAnggaran.update({ where: { id: item.id }, data: { jumlahDisetujui: item.amount } })));
      const verification = selectedVerificationId ? null : await createVerificationDocument(tx, {
        nomorSurat: rab.nomorRab,
        keteranganSurat: `Persetujuan RAB - ${rab.namaKegiatan}`,
        signer
      });
      const row = await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { totalDisetujui, status: 'DISETUJUI', approvedById: req.user.id, approvedAt: new Date(), rejectedReason: null, rabQrDocumentId: selectedVerificationId || verification.id }, include: rabInclude });
      await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'DISETUJUI', oldValue: { status: rab.status }, newValue: { status: 'DISETUJUI', totalDisetujui }, reason: req.body.catatan, userId: req.user.id });
      return row;
    });
    res.json({ success: true, message: 'RAB berhasil disetujui', data: withSummary(updated) });
  } catch (error) {
    console.error('Approve RAB Error:', error);
    fail(res, 400, error.message || 'Gagal menyetujui RAB');
  }
};

const rejectRab = async (req, res) => {
  try {
    if (!req.body.alasan?.trim()) return fail(res, 400, 'Alasan penolakan wajib diisi');
    const rab = await prisma.rencanaAnggaran.findUnique({ where: { id: asInt(req.params.id) } });
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (rab.status !== 'DIAJUKAN') return fail(res, 409, 'RAB tidak dapat ditolak pada status ini');
    await prisma.$transaction(async (tx) => {
      await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'DITOLAK', rejectedReason: req.body.alasan.trim() } });
      await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'DITOLAK', oldValue: { status: rab.status }, newValue: { status: 'DITOLAK' }, reason: req.body.alasan, userId: req.user.id });
    });
    res.json({ success: true, message: 'RAB ditolak dan dikembalikan kepada Admin' });
  } catch (error) {
    console.error('Reject RAB Error:', error);
    fail(res, 500, 'Gagal menolak RAB');
  }
};

const signAdjustedRab = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (!['DISETUJUI','DICAIRKAN_SEBAGIAN','DICAIRKAN_PENUH','REALISASI','PERLU_REVISI','DALAM_PENYESUAIAN'].includes(rab.status) || rab.rabQrDocumentId) return fail(res, 409, 'Tanda tangan revisi hanya tersedia untuk RAB disetujui yang belum memiliki QR');
    if (rab.perubahanAnggarans.some(p => p.status === 'MENUNGGU_VERIFIKASI')) return fail(res, 409, 'Selesaikan persetujuan komponen anggaran terlebih dahulu');
    const selected = await resolveRabVerificationDocument({ id: req.body.rabQrDocumentId, token: req.body.rabQrDocumentToken, currentRabId: rab.id });
    const signer = selected ? null : getSignerData(req.body);
    await prisma.$transaction(async tx => {
      const verification = selected ? null : await createVerificationDocument(tx, { nomorSurat: rab.nomorRab, keteranganSurat: `RAB revisi ${rab.revision} - ${rab.namaKegiatan}`.slice(0, 200), signer });
      const qrId = selected || verification.id;
      await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { rabQrDocumentId: qrId } });
      await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'RAB_REVISI_DITANDATANGANI', newValue: { revision: rab.revision, rabQrDocumentId: String(qrId) }, userId: req.user.id });
    });
    res.json({ success: true, message: 'Tanda tangan RAB revisi berhasil disimpan' });
  } catch (error) { fail(res, 400, error.message || 'Gagal menandatangani RAB'); }
};


const addExpense = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (!['DICAIRKAN_SEBAGIAN', 'DICAIRKAN_PENUH', 'REALISASI', 'PERLU_REVISI', 'DALAM_PENYESUAIAN'].includes(rab.status)) return fail(res, 409, 'Pengeluaran belum dapat dicatat pada status RAB ini');
    const nominal = asMoney(req.body.nominal);
    if (nominal <= 0 || !req.body.kategoriId || !req.body.akunKasId || !req.body.uraian?.trim() || !req.body.metode) return fail(res, 400, 'Data pengeluaran belum lengkap');
    const summary = summarizeRab(rab);
    if (nominal > summary.kasTersediaUntukInput) return fail(res, 409, 'Nominal pengeluaran melebihi kas yang tersedia');
    if (nominal > summarizeAccount(rab, req.body.akunKasId).kasTersediaUntukInput) return fail(res, 409, 'Dana RAB pada akun kas yang dipilih tidak mencukupi');
    let allowOverBudget = req.body.allowOverBudget === true || req.body.allowOverBudget === 'true';
    if (allowOverBudget && !isTreasurer(req.user)) return fail(res, 403, 'Hanya Bendahara yang dapat memberi pengecualian anggaran');
    if (allowOverBudget && !req.body.overrideReason?.trim()) return fail(res, 400, 'Alasan pengecualian anggaran wajib diisi');
    if (req.body.itemAnggaranId) {
      const item = rab.items.find((row) => row.id === asInt(req.body.itemAnggaranId));
      if (!item) return fail(res, 400, 'Item anggaran tidak termasuk dalam RAB ini');
      const used = rab.pengeluarans.filter((row) => row.itemAnggaranId === item.id && ['MENUNGGU_VERIFIKASI', 'VERIFIKASI'].includes(row.status)).reduce((t, row) => t + Number(row.nominal), 0);
      if (used + nominal > Number(item.jumlahDisetujui) && !allowOverBudget) return fail(res, 409, 'Nominal melebihi sisa item anggaran. Bendahara dapat memberi pengecualian dengan alasan.');
    }
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.pengeluaranRab.create({ data: { rabId: rab.id, itemAnggaranId: req.body.itemAnggaranId ? asInt(req.body.itemAnggaranId) : null, kategoriId: asInt(req.body.kategoriId), akunKasId: asInt(req.body.akunKasId), tanggal: new Date(req.body.tanggal || Date.now()), uraian: req.body.uraian.trim(), penerima: req.body.penerima || null, nominal, metode: req.body.metode, nomorBukti: req.body.nomorBukti || null, buktiPath: safeFilePath(req.file), keterangan: req.body.keterangan || null, allowOverBudget, overrideReason: req.body.overrideReason || null, createdById: req.user.id } });
      if (!['PERLU_REVISI', 'DALAM_PENYESUAIAN'].includes(rab.status)) await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'REALISASI' } });
      await audit(tx, { entityType: 'PENGELUARAN', entityId: row.id, action: 'DICATAT', newValue: { rabId: rab.id, nominal, status: row.status }, reason: req.body.overrideReason, userId: req.user.id });
      return row;
    });
    res.status(201).json({ success: true, message: 'Pengeluaran dicatat dan menunggu verifikasi Bendahara', data: result });
  } catch (error) {
    console.error('Add Expense Error:', error);
    fail(res, 400, error.message || 'Gagal mencatat pengeluaran');
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await prisma.pengeluaranRab.findUnique({
      where: { id: asInt(req.params.id) },
      include: { rab: { include: rabInclude } }
    });
    if (!expense) return fail(res, 404, 'Pengeluaran tidak ditemukan');
    if (expense.status !== 'MENUNGGU_VERIFIKASI') return fail(res, 409, 'Hanya pengeluaran yang menunggu verifikasi yang dapat diedit');

    const nominal = asMoney(req.body.nominal);
    if (nominal <= 0 || !req.body.kategoriId || !req.body.akunKasId || !req.body.uraian?.trim() || !req.body.metode) return fail(res, 400, 'Data pengeluaran belum lengkap');
    const summary = summarizeRab(expense.rab);
    if (nominal > summary.kasTersediaUntukInput + Number(expense.nominal)) return fail(res, 409, 'Nominal pengeluaran melebihi kas yang tersedia');
    const accountAvailable = summarizeAccount(expense.rab, req.body.akunKasId).kasTersediaUntukInput + (expense.akunKasId === asInt(req.body.akunKasId) ? Number(expense.nominal) : 0);
    if (nominal > accountAvailable) return fail(res, 409, 'Dana pada akun kas yang dipilih tidak mencukupi');

    const itemAnggaranId = req.body.itemAnggaranId ? asInt(req.body.itemAnggaranId) : null;
    const allowOverBudget = req.body.allowOverBudget === true || req.body.allowOverBudget === 'true';
    if (allowOverBudget && !req.body.overrideReason?.trim()) return fail(res, 400, 'Alasan pengecualian anggaran wajib diisi');
    if (itemAnggaranId) {
      const item = expense.rab.items.find((row) => row.id === itemAnggaranId);
      if (!item) return fail(res, 400, 'Item anggaran tidak termasuk dalam RAB ini');
      const used = expense.rab.pengeluarans
        .filter((row) => row.id !== expense.id && row.itemAnggaranId === item.id && ['MENUNGGU_VERIFIKASI', 'VERIFIKASI'].includes(row.status))
        .reduce((total, row) => total + Number(row.nominal), 0);
      if (used + nominal > Number(item.jumlahDisetujui) && !allowOverBudget) return fail(res, 409, 'Nominal melebihi sisa item anggaran. Aktifkan pengecualian dan isi alasannya bila tetap akan diproses.');
    }

    const oldValue = {
      tanggal: expense.tanggal,
      uraian: expense.uraian,
      penerima: expense.penerima,
      nominal: Number(expense.nominal),
      nomorBukti: expense.nomorBukti
    };
    const data = {
      itemAnggaranId,
      kategoriId: asInt(req.body.kategoriId),
      akunKasId: asInt(req.body.akunKasId),
      tanggal: new Date(req.body.tanggal || expense.tanggal),
      uraian: req.body.uraian.trim(),
      penerima: req.body.penerima?.trim() || null,
      nominal,
      metode: req.body.metode,
      nomorBukti: req.body.nomorBukti?.trim() || null,
      keterangan: req.body.keterangan?.trim() || null,
      allowOverBudget,
      overrideReason: allowOverBudget ? req.body.overrideReason.trim() : null,
      ...(req.file ? { buktiPath: safeFilePath(req.file) } : {})
    };
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.pengeluaranRab.update({ where: { id: expense.id }, data });
      await audit(tx, { entityType: 'PENGELUARAN', entityId: expense.id, action: 'DIPERBARUI_SAAT_VERIFIKASI', oldValue, newValue: { rabId: expense.rabId, ...data, tanggal: data.tanggal.toISOString() }, reason: data.overrideReason, userId: req.user.id });
      return row;
    });
    res.json({ success: true, message: 'Detail pengeluaran berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Update Expense Error:', error);
    fail(res, 400, error.message || 'Gagal memperbarui pengeluaran');
  }
};

const verifyExpense = async (req, res) => {
  try {
    const expense = await prisma.pengeluaranRab.findUnique({ where: { id: asInt(req.params.id) }, include: { rab: { include: { pencairans: true, pengeluarans: true, pengembalians: true } } } });
    if (!expense) return fail(res, 404, 'Pengeluaran tidak ditemukan');
    if (expense.status !== 'MENUNGGU_VERIFIKASI') return fail(res, 409, 'Pengeluaran sudah diproses');
    const summary = summarizeRab(expense.rab);
    if (Number(expense.nominal) > summary.sisaKas) return fail(res, 409, 'Kas tersedia tidak mencukupi untuk memverifikasi pengeluaran ini');
    if (Number(expense.nominal) > summarizeAccount(expense.rab, expense.akunKasId).sisaKas) return fail(res, 409, 'Dana pada akun kas pengeluaran tidak mencukupi');
    await prisma.$transaction(async (tx) => {
      await tx.pengeluaranRab.update({ where: { id: expense.id }, data: { status: 'VERIFIKASI', verifiedById: req.user.id, verifiedAt: new Date(), rejectedReason: null } });
      await audit(tx, { entityType: 'PENGELUARAN', entityId: expense.id, action: 'DIVERIFIKASI', oldValue: { status: expense.status }, newValue: { rabId: expense.rabId, status: 'VERIFIKASI', nominal: Number(expense.nominal) }, userId: req.user.id });
    });
    res.json({ success: true, message: 'Pengeluaran berhasil diverifikasi' });
  } catch (error) {
    console.error('Verify Expense Error:', error);
    fail(res, 500, 'Gagal memverifikasi pengeluaran');
  }
};

const rejectExpense = async (req, res) => {
  try {
    if (!req.body.alasan?.trim()) return fail(res, 400, 'Alasan penolakan wajib diisi');
    const expense = await prisma.pengeluaranRab.findUnique({ where: { id: asInt(req.params.id) } });
    if (!expense) return fail(res, 404, 'Pengeluaran tidak ditemukan');
    if (expense.status !== 'MENUNGGU_VERIFIKASI') return fail(res, 409, 'Pengeluaran sudah diproses');
    await prisma.$transaction(async (tx) => {
      await tx.pengeluaranRab.update({ where: { id: expense.id }, data: { status: 'DITOLAK', rejectedReason: req.body.alasan.trim(), verifiedById: req.user.id, verifiedAt: new Date() } });
      await audit(tx, { entityType: 'PENGELUARAN', entityId: expense.id, action: 'DITOLAK', oldValue: { status: expense.status }, newValue: { rabId: expense.rabId, status: 'DITOLAK' }, reason: req.body.alasan, userId: req.user.id });
    });
    res.json({ success: true, message: 'Pengeluaran ditolak' });
  } catch (error) {
    console.error('Reject Expense Error:', error);
    fail(res, 500, 'Gagal menolak pengeluaran');
  }
};

const addReturn = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (['SELESAI', 'MENUNGGU_VERIFIKASI_LPJ'].includes(rab.status)) return fail(res, 409, 'Buka penyesuaian sebelum mengembalikan dana');
    const nominal = asMoney(req.body.nominal);
    const summary = summarizeRab(rab);
    if (nominal <= 0 || !req.body.akunKasId) return fail(res, 400, 'Data pengembalian belum lengkap');
    if (nominal > summary.kasTersediaUntukInput) return fail(res, 409, 'Pengembalian dana melebihi kas tersedia setelah pengeluaran menunggu verifikasi');
    if (nominal > summarizeAccount(rab, req.body.akunKasId).kasTersediaUntukInput) return fail(res, 409, 'Saldo akun kas pengembalian tidak mencukupi');
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.pengembalianDana.create({ data: { rabId: rab.id, akunKasId: asInt(req.body.akunKasId), tanggal: new Date(req.body.tanggal || Date.now()), nominal, nomorReferensi: req.body.nomorReferensi || null, buktiPath: safeFilePath(req.file), keterangan: req.body.keterangan || null, createdById: req.user.id } });
      await audit(tx, { entityType: 'PENGEMBALIAN', entityId: created.id, action: 'DICATAT', newValue: { rabId: rab.id, nominal, status: 'AKTIF' }, userId: req.user.id });
      return created;
    });
    res.status(201).json({ success: true, message: 'Pengembalian dana berhasil dicatat', data: row });
  } catch (error) {
    console.error('Add Return Error:', error);
    fail(res, 500, 'Gagal mencatat pengembalian dana');
  }
};

const cancelTransaction = (model, entityType) => async (req, res) => {
  try {
    if (!req.body.alasan?.trim()) return fail(res, 400, 'Alasan pembatalan wajib diisi');
    const row = await prisma[model].findUnique({ where: { id: asInt(req.params.id) } });
    if (!row) return fail(res, 404, 'Transaksi tidak ditemukan');
    if (row.status === 'DIBATALKAN') return fail(res, 409, 'Transaksi sudah dibatalkan');
    const rab = await getRabOrFail(row.rabId);
    if (!rab) return fail(res, 404, 'RAB transaksi tidak ditemukan');
    if (['MENUNGGU_VERIFIKASI_LPJ', 'SELESAI'].includes(rab.status)) return fail(res, 409, 'Transaksi pada LPJ yang sedang diverifikasi atau sudah ditutup tidak dapat dikoreksi');
    if (model === 'pencairanDana' && row.status === 'AKTIF') {
      const summary = summarizeRab(rab);
      if (Number(row.nominal) > summarizeAccount(rab, row.akunKasId).kasTersediaUntukInput) return fail(res, 409, 'Dana pada akun ini sudah digunakan atau dialokasikan untuk pengeluaran');
      if (summary.danaMasuk - Number(row.nominal) < summary.pengeluaranTerverifikasi + summary.pengeluaranMenunggu + summary.danaDikembalikan) {
        return fail(res, 409, 'Pencairan tidak dapat dibatalkan karena dananya sudah direalisasikan atau dikembalikan');
      }
    }
    await prisma.$transaction(async (tx) => {
      await tx[model].update({ where: { id: row.id }, data: { status: 'DIBATALKAN', cancelledById: req.user.id, cancelledAt: new Date(), cancelReason: req.body.alasan.trim() } });
      if (!['PERLU_REVISI', 'DALAM_PENYESUAIAN'].includes(rab.status) && ['pencairanDana', 'pengeluaranRab'].includes(model)) {
        const [funds, activeExpenses] = await Promise.all([
          tx.pencairanDana.aggregate({ where: { rabId: rab.id, status: 'AKTIF' }, _sum: { nominal: true } }),
          tx.pengeluaranRab.count({ where: { rabId: rab.id, status: { in: ['MENUNGGU_VERIFIKASI', 'VERIFIKASI'] } } })
        ]);
        const totalFunds = Number(funds._sum.nominal || 0);
        const nextStatus = activeExpenses > 0 ? 'REALISASI' : totalFunds <= 0 ? 'DISETUJUI' : totalFunds >= Number(rab.totalDisetujui) ? 'DICAIRKAN_PENUH' : 'DICAIRKAN_SEBAGIAN';
        await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: nextStatus } });
      }
      await audit(tx, { entityType, entityId: row.id, action: 'DIBATALKAN', oldValue: { status: row.status }, newValue: { rabId: row.rabId, status: 'DIBATALKAN' }, reason: req.body.alasan, userId: req.user.id });
    });
    res.json({ success: true, message: 'Transaksi berhasil dibatalkan dan jejak audit dipertahankan' });
  } catch (error) {
    console.error(`Cancel ${entityType} Error:`, error);
    fail(res, 500, 'Gagal membatalkan transaksi');
  }
};

const submitLpj = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (!['REALISASI', 'DICAIRKAN_PENUH', 'DICAIRKAN_SEBAGIAN', 'PERLU_REVISI', 'DALAM_PENYESUAIAN'].includes(rab.status)) return fail(res, 409, 'LPJ belum dapat diajukan pada status ini');
    if (rab.pencairans.some(r => r.status === 'MENUNGGU_VERIFIKASI') || rab.perubahanAnggarans.some(r => r.status === 'MENUNGGU_VERIFIKASI')) return fail(res, 409, 'Masih ada penerimaan atau penyesuaian anggaran menunggu verifikasi');
    if (rab.pengeluarans.some((row) => row.status === 'MENUNGGU_VERIFIKASI')) return fail(res, 409, 'Masih ada pengeluaran yang menunggu verifikasi');
    await prisma.$transaction(async (tx) => {
      await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'MENUNGGU_VERIFIKASI_LPJ', ...(rab.status === 'PERLU_REVISI' ? { revision: { increment: 1 } } : {}) } });
      await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'LPJ_DIAJUKAN', oldValue: { status: rab.status }, newValue: { status: 'MENUNGGU_VERIFIKASI_LPJ' }, userId: req.user.id });
    });
    res.json({ success: true, message: 'LPJ berhasil diajukan untuk verifikasi' });
  } catch (error) {
    console.error('Submit LPJ Error:', error);
    fail(res, 500, 'Gagal mengajukan LPJ');
  }
};

const requestRevision = async (req, res) => {
  try {
    if (!req.body.alasan?.trim()) return fail(res, 400, 'Catatan revisi wajib diisi');
    const rab = await prisma.rencanaAnggaran.findUnique({ where: { id: asInt(req.params.id) } });
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (rab.status !== 'MENUNGGU_VERIFIKASI_LPJ') return fail(res, 409, 'LPJ tidak sedang menunggu verifikasi');
    await prisma.$transaction(async (tx) => {
      await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'PERLU_REVISI', catatan: req.body.alasan.trim() } });
      await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'LPJ_PERLU_REVISI', oldValue: { status: rab.status }, newValue: { status: 'PERLU_REVISI' }, reason: req.body.alasan, userId: req.user.id });
    });
    res.json({ success: true, message: 'LPJ dikembalikan untuk direvisi' });
  } catch (error) {
    console.error('Request Revision Error:', error);
    fail(res, 500, 'Gagal meminta revisi LPJ');
  }
};

const closeRab = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (rab.status !== 'MENUNGGU_VERIFIKASI_LPJ') return fail(res, 409, 'LPJ belum diajukan untuk verifikasi');
    const summary = summarizeRab(rab);
    if (summary.pengeluaranMenunggu > 0) return fail(res, 409, 'Masih ada pengeluaran yang menunggu verifikasi');
    if (summary.penerimaanMenunggu > 0 || rab.perubahanAnggarans.some(r => r.status === 'MENUNGGU_VERIFIKASI')) return fail(res, 409, 'Masih ada penerimaan atau penyesuaian menunggu verifikasi');
    if (summary.sisaKas !== 0) return fail(res, 409, `Sisa kas Rp ${summary.sisaKas.toLocaleString('id-ID')} harus dikembalikan sebelum LPJ ditutup`);
    const selectedVerificationId = await resolveLpjVerificationDocument({
      id: req.body.lpjQrDocumentId,
      token: req.body.lpjQrDocumentToken,
      currentRabId: rab.id
    }) || rab.lpjQrDocumentId;
    const signer = selectedVerificationId ? null : getSignerData(req.body);
    await prisma.$transaction(async (tx) => {
      const verification = selectedVerificationId ? null : await createVerificationDocument(tx, {
        nomorSurat: rab.nomorRab,
        keteranganSurat: `Persetujuan LPJ - ${rab.namaKegiatan}`,
        signer
      });
      await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'SELESAI', closedById: req.user.id, closedAt: new Date(), lpjQrDocumentId: selectedVerificationId || verification.id } });
      await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'LPJ_DITUTUP', oldValue: { status: rab.status }, newValue: { status: 'SELESAI', ...summary }, userId: req.user.id });
    });
    res.json({ success: true, message: 'LPJ telah diverifikasi dan RAB ditutup' });
  } catch (error) {
    console.error('Close RAB Error:', error);
    fail(res, 400, error.message || 'Gagal menutup LPJ');
  }
};

const signCompletedLpj = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (rab.status !== 'SELESAI') return fail(res, 409, 'Fitur ini hanya untuk melengkapi tanda tangan LPJ yang sudah selesai');
    if (rab.lpjQrDocumentId) return fail(res, 409, 'LPJ sudah memiliki tanda tangan elektronik');
    const selectedVerificationId = await resolveLpjVerificationDocument({
      id: req.body.lpjQrDocumentId,
      token: req.body.lpjQrDocumentToken,
      currentRabId: rab.id
    });
    const signer = selectedVerificationId ? null : getSignerData(req.body);
    const updated = await prisma.$transaction(async (tx) => {
      const verification = selectedVerificationId ? null : await createVerificationDocument(tx, {
        nomorSurat: rab.nomorRab,
        keteranganSurat: `Persetujuan LPJ - ${rab.namaKegiatan}`,
        signer
      });
      const lpjQrDocumentId = selectedVerificationId || verification.id;
      const row = await tx.rencanaAnggaran.update({
        where: { id: rab.id },
        data: { lpjQrDocumentId },
        include: rabInclude
      });
      await audit(tx, {
        entityType: 'RAB',
        entityId: rab.id,
        action: 'TANDA_TANGAN_LPJ_DILENGKAPI',
        oldValue: { status: rab.status, lpjQrDocumentId: null },
        newValue: { status: rab.status, lpjQrDocumentId: lpjQrDocumentId.toString() },
        userId: req.user.id
      });
      return row;
    });
    res.json({ success: true, message: 'Tanda tangan elektronik LPJ berhasil ditambahkan', data: withSummary(updated) });
  } catch (error) {
    console.error('Sign Completed LPJ Error:', error);
    fail(res, 400, error.message || 'Gagal menambahkan tanda tangan LPJ');
  }
};

const evidenceTargets = {
  rab: { model: 'rencanaAnggaran', field: 'dokumenPath', entityType: 'RAB' },
  pencairan: { model: 'pencairanDana', field: 'buktiPath', entityType: 'PENCAIRAN' },
  pengeluaran: { model: 'pengeluaranRab', field: 'buktiPath', entityType: 'PENGELUARAN' },
  pengembalian: { model: 'pengembalianDana', field: 'buktiPath', entityType: 'PENGEMBALIAN' }
};

const updateEvidence = (targetName) => async (req, res) => {
  try {
    const target = evidenceTargets[targetName];
    if (!req.file) return fail(res, 400, 'Pilih berkas bukti yang akan diunggah');
    const id = asInt(req.params.id);
    const existing = await prisma[target.model].findUnique({ where: { id } });
    if (!existing) return fail(res, 404, 'Data transaksi tidak ditemukan');
    const newPath = safeFilePath(req.file);
    await prisma.$transaction(async (tx) => {
      await tx[target.model].update({ where: { id }, data: { [target.field]: newPath } });
      await audit(tx, {
        entityType: target.entityType,
        entityId: id,
        action: existing[target.field] ? 'BUKTI_DIGANTI' : 'BUKTI_DIUNGGAH',
        oldValue: { path: existing[target.field] },
        newValue: { path: newPath },
        userId: req.user.id
      });
    });
    res.json({ success: true, message: existing[target.field] ? 'Berkas bukti berhasil diganti' : 'Berkas bukti berhasil diunggah', data: { path: newPath } });
  } catch (error) {
    console.error(`Update ${targetName} Evidence Error:`, error);
    fail(res, 400, error.message || 'Gagal mengunggah berkas bukti');
  }
};

const listMaster = (model) => async (req, res) => {
  try {
    const rows = await prisma[model].findMany({ orderBy: [{ isAktif: 'desc' }, { nama: 'asc' }] });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('List Master Error:', error);
    fail(res, 500, 'Gagal memuat master keuangan');
  }
};

const saveCategory = async (req, res) => {
  try {
    if (!req.body.kode?.trim() || !req.body.nama?.trim()) return fail(res, 400, 'Kode dan nama kategori wajib diisi');
    const data = { kode: req.body.kode.trim().toUpperCase(), nama: req.body.nama.trim(), deskripsi: req.body.deskripsi || null, isAktif: req.body.isAktif !== false };
    const row = req.params.id ? await prisma.kategoriKeuangan.update({ where: { id: asInt(req.params.id) }, data }) : await prisma.kategoriKeuangan.create({ data });
    res.status(req.params.id ? 200 : 201).json({ success: true, message: 'Kategori berhasil disimpan', data: row });
  } catch (error) {
    console.error('Save Category Error:', error);
    fail(res, 400, 'Kode kategori sudah digunakan atau data tidak valid');
  }
};

const saveAccount = async (req, res) => {
  try {
    if (!req.body.kode?.trim() || !req.body.nama?.trim() || !['KAS', 'BANK'].includes(req.body.tipe)) return fail(res, 400, 'Data akun kas belum lengkap');
    const data = { kode: req.body.kode.trim().toUpperCase(), nama: req.body.nama.trim(), tipe: req.body.tipe, namaBank: req.body.namaBank || null, nomorRekening: req.body.nomorRekening || null, isAktif: req.body.isAktif !== false };
    const row = req.params.id ? await prisma.akunKas.update({ where: { id: asInt(req.params.id) }, data }) : await prisma.akunKas.create({ data });
    res.status(req.params.id ? 200 : 201).json({ success: true, message: 'Akun kas berhasil disimpan', data: row });
  } catch (error) {
    console.error('Save Account Error:', error);
    fail(res, 400, 'Kode akun sudah digunakan atau data tidak valid');
  }
};

const exportExcel = async (req, res) => {
  try {
    const archived = req.query.arsip ? await prisma.arsipLpj.findFirst({ where: { id: asInt(req.query.arsip), rabId: asInt(req.params.id) } }) : null;
    if (req.query.arsip && !archived) return fail(res, 404, 'Arsip LPJ tidak ditemukan');
    const rab = archived ? archived.snapshot : await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    const summary = summarizeRab(rab);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vidya - Sistem Keuangan';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Ringkasan LPJ', { views: [{ showGridLines: false }] });
    sheet.columns = [{ width: 24 }, { width: 58 }, { width: 24 }];
    sheet.mergeCells('A1:C1');
    sheet.getCell('A1').value = 'LAPORAN PERTANGGUNGJAWABAN DANA';
    sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF14532D' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;
    const info = [
      ['Nomor RAB', rab.nomorRab], ['No. Referensi', rab.nomorReferensi || '-'], ['Kegiatan', rab.namaKegiatan], ['Program Ajahan', rab.programAjahan?.nama || '-'],
      ['Penanggung Jawab', rab.penanggungJawab], ['Periode', `${new Date(rab.tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(rab.tanggalSelesai).toLocaleDateString('id-ID')}`], ['Status', rab.status]
    ];
    info.forEach((row) => sheet.addRow([row[0], row[1]]));
    sheet.addRow([]);
    [['Anggaran Disetujui', Number(rab.totalDisetujui)], ['Dana Masuk', summary.danaMasuk], ['Pengeluaran Terverifikasi', summary.pengeluaranTerverifikasi], ['Dana Dikembalikan', summary.danaDikembalikan], ['Sisa Kas', summary.sisaKas], ['Sisa Anggaran', summary.sisaAnggaran]].forEach((row) => {
      const excelRow = sheet.addRow([row[0], '', row[1]]);
      excelRow.getCell(3).numFmt = '[$Rp-id-ID] #,##0';
    });
    sheet.eachRow((row, rowNumber) => { if (rowNumber > 1) row.alignment = { vertical: 'middle' }; });

    const detail = workbook.addWorksheet('Realisasi Pengeluaran', { views: [{ state: 'frozen', ySplit: 1 }] });
    detail.columns = [
      { header: 'No', key: 'no', width: 7 }, { header: 'Tanggal', key: 'tanggal', width: 15 }, { header: 'Kategori', key: 'kategori', width: 22 },
      { header: 'Uraian', key: 'uraian', width: 42 }, { header: 'Penerima', key: 'penerima', width: 24 }, { header: 'Metode', key: 'metode', width: 15 },
      { header: 'No. Bukti', key: 'bukti', width: 20 }, { header: 'Status', key: 'status', width: 22 }, { header: 'Nominal', key: 'nominal', width: 22 }
    ];
    rab.pengeluarans.forEach((row, index) => detail.addRow({ no: index + 1, tanggal: new Date(row.tanggal), kategori: row.kategori.nama, uraian: row.uraian, penerima: row.penerima || '-', metode: row.metode, bukti: row.nomorBukti || '-', status: row.status, nominal: Number(row.nominal) }));
    detail.getColumn('tanggal').numFmt = 'dd/mm/yyyy';
    detail.getColumn('nominal').numFmt = '[$Rp-id-ID] #,##0';
    detail.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detail.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    detail.autoFilter = { from: 'A1', to: 'I1' };
    const receipts = workbook.addWorksheet('Dana Masuk');
    receipts.addRow(['Tanggal', 'Jenis Sumber', 'Pemberi / Asal Dana', 'Kas', 'Referensi', 'Status', 'Nominal']);
    rab.pencairans.forEach(r => receipts.addRow([new Date(r.tanggal), r.jenisSumber || 'BENDAHARA', r.sumberDana, r.akunKas?.nama || '', r.nomorReferensi || '', r.status, Number(r.nominal)]));
    receipts.columns.forEach(c => { c.width = 24; }); receipts.getColumn(1).numFmt = 'dd/mm/yyyy'; receipts.getColumn(7).numFmt = '#,##0';
    sheet.addRow(['Pencairan Bendahara', '', summary.pencairanBendahara]);
    sheet.addRow(['Hibah / Punia / Lainnya', '', summary.danaTambahan]);
    sheet.addRow(['Penerimaan Menunggu', '', summary.penerimaanMenunggu]);
    sheet.addRow(['Revisi', rab.revision]);
    const filename = `LPJ-${rab.nomorRab.replaceAll('/', '-')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Finance Excel Error:', error);
    if (!res.headersSent) fail(res, 500, 'Gagal membuat laporan Excel');
  }
};

const serveFile = async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, '../../uploads', filename);
    if (!fs.existsSync(filePath)) return fail(res, 404, 'Berkas tidak ditemukan');
    res.sendFile(filePath);
  } catch (error) {
    fail(res, 500, 'Gagal membuka berkas');
  }
};

module.exports = {
  signAdjustedRab,
  getDashboard, listVerificationDocuments, listRab, getRab, createRab, updateRab, updateRabMetadata, submitRab, approveRab, rejectRab,
  addExpense, updateExpense, verifyExpense, rejectExpense, addReturn,
  cancelDisbursement: cancelTransaction('pencairanDana', 'PENCAIRAN'),
  cancelExpense: cancelTransaction('pengeluaranRab', 'PENGELUARAN'),
  cancelReturn: cancelTransaction('pengembalianDana', 'PENGEMBALIAN'),
  submitLpj, requestRevision, closeRab, signCompletedLpj,
  updateRabEvidence: updateEvidence('rab'),
  updateDisbursementEvidence: updateEvidence('pencairan'),
  updateExpenseEvidence: updateEvidence('pengeluaran'),
  updateReturnEvidence: updateEvidence('pengembalian'),
  listCategories: listMaster('kategoriKeuangan'), listAccounts: listMaster('akunKas'), saveCategory, saveAccount,
  exportExcel, serveFile
};
