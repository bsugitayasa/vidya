const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');
const { rabInclude, withSummary, summarizeRab, audit, treasurerRoles } = require('../services/keuangan.service');

const prisma = new PrismaClient();
const asInt = (value) => Number.parseInt(value, 10);
const asMoney = (value) => Math.round(Number(value || 0));
const isTreasurer = (user) => treasurerRoles.includes(user.role);
const parseItems = (value) => typeof value === 'string' ? JSON.parse(value) : value;
const safeFilePath = (file) => file ? `/uploads/${file.filename}` : null;

const fail = (res, status, message) => res.status(status).json({ success: false, message });

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
    const rab = await prisma.$transaction(async (tx) => {
      const created = await tx.rencanaAnggaran.create({
        data: {
          nomorRab,
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
    const data = {
      ...(req.body.namaKegiatan ? { namaKegiatan: req.body.namaKegiatan.trim() } : {}),
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
    const updated = await prisma.$transaction(async (tx) => {
      await Promise.all(approvedItems.map((item) => tx.itemAnggaran.update({ where: { id: item.id }, data: { jumlahDisetujui: item.amount } })));
      const row = await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { totalDisetujui, status: 'DISETUJUI', approvedById: req.user.id, approvedAt: new Date(), rejectedReason: null }, include: rabInclude });
      await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'DISETUJUI', oldValue: { status: rab.status }, newValue: { status: 'DISETUJUI', totalDisetujui }, reason: req.body.catatan, userId: req.user.id });
      return row;
    });
    res.json({ success: true, message: 'RAB berhasil disetujui', data: withSummary(updated) });
  } catch (error) {
    console.error('Approve RAB Error:', error);
    fail(res, 500, 'Gagal menyetujui RAB');
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

const addDisbursement = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (!['DISETUJUI', 'DICAIRKAN_SEBAGIAN', 'DICAIRKAN_PENUH', 'REALISASI'].includes(rab.status)) return fail(res, 409, 'Dana hanya dapat dicairkan setelah RAB disetujui');
    const nominal = asMoney(req.body.nominal);
    if (nominal <= 0 || !req.body.akunKasId || !req.body.sumberDana?.trim()) return fail(res, 400, 'Data pencairan belum lengkap');
    const ringkasan = summarizeRab(rab);
    if (ringkasan.danaMasuk + nominal > Number(rab.totalDisetujui)) return fail(res, 409, 'Total pencairan melebihi anggaran yang disetujui');
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.pencairanDana.create({ data: { rabId: rab.id, akunKasId: asInt(req.body.akunKasId), tanggal: new Date(req.body.tanggal || Date.now()), nominal, sumberDana: req.body.sumberDana.trim(), nomorReferensi: req.body.nomorReferensi || null, buktiPath: safeFilePath(req.file), keterangan: req.body.keterangan || null, createdById: req.user.id } });
      const total = ringkasan.danaMasuk + nominal;
      const status = total >= Number(rab.totalDisetujui) ? 'DICAIRKAN_PENUH' : 'DICAIRKAN_SEBAGIAN';
      await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status } });
      await audit(tx, { entityType: 'PENCAIRAN', entityId: row.id, action: 'DICATAT', newValue: { rabId: rab.id, nominal, status: 'AKTIF' }, userId: req.user.id });
      return row;
    });
    res.status(201).json({ success: true, message: 'Pencairan dana berhasil dicatat', data: result });
  } catch (error) {
    console.error('Add Disbursement Error:', error);
    fail(res, 400, error.message || 'Gagal mencatat pencairan');
  }
};

const addExpense = async (req, res) => {
  try {
    const rab = await getRabOrFail(req.params.id);
    if (!rab) return fail(res, 404, 'RAB tidak ditemukan');
    if (!['DICAIRKAN_SEBAGIAN', 'DICAIRKAN_PENUH', 'REALISASI', 'PERLU_REVISI'].includes(rab.status)) return fail(res, 409, 'Pengeluaran belum dapat dicatat pada status RAB ini');
    const nominal = asMoney(req.body.nominal);
    if (nominal <= 0 || !req.body.kategoriId || !req.body.akunKasId || !req.body.uraian?.trim() || !req.body.metode) return fail(res, 400, 'Data pengeluaran belum lengkap');
    const summary = summarizeRab(rab);
    if (nominal > summary.kasTersediaUntukInput) return fail(res, 409, 'Nominal pengeluaran melebihi kas yang tersedia');
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
      if (rab.status !== 'PERLU_REVISI') await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'REALISASI' } });
      await audit(tx, { entityType: 'PENGELUARAN', entityId: row.id, action: 'DICATAT', newValue: { rabId: rab.id, nominal, status: row.status }, reason: req.body.overrideReason, userId: req.user.id });
      return row;
    });
    res.status(201).json({ success: true, message: 'Pengeluaran dicatat dan menunggu verifikasi Bendahara', data: result });
  } catch (error) {
    console.error('Add Expense Error:', error);
    fail(res, 400, error.message || 'Gagal mencatat pengeluaran');
  }
};

const verifyExpense = async (req, res) => {
  try {
    const expense = await prisma.pengeluaranRab.findUnique({ where: { id: asInt(req.params.id) }, include: { rab: { include: { pencairans: true, pengeluarans: true, pengembalians: true } } } });
    if (!expense) return fail(res, 404, 'Pengeluaran tidak ditemukan');
    if (expense.status !== 'MENUNGGU_VERIFIKASI') return fail(res, 409, 'Pengeluaran sudah diproses');
    const summary = summarizeRab(expense.rab);
    if (Number(expense.nominal) > summary.sisaKas) return fail(res, 409, 'Kas tersedia tidak mencukupi untuk memverifikasi pengeluaran ini');
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
    const nominal = asMoney(req.body.nominal);
    const summary = summarizeRab(rab);
    if (nominal <= 0 || !req.body.akunKasId) return fail(res, 400, 'Data pengembalian belum lengkap');
    if (nominal > summary.sisaKas) return fail(res, 409, 'Pengembalian dana melebihi sisa kas');
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
    if (model === 'pencairanDana') {
      const summary = summarizeRab(rab);
      if (summary.danaMasuk - Number(row.nominal) < summary.pengeluaranTerverifikasi + summary.danaDikembalikan) {
        return fail(res, 409, 'Pencairan tidak dapat dibatalkan karena dananya sudah direalisasikan atau dikembalikan');
      }
    }
    await prisma.$transaction(async (tx) => {
      await tx[model].update({ where: { id: row.id }, data: { status: 'DIBATALKAN', cancelledById: req.user.id, cancelledAt: new Date(), cancelReason: req.body.alasan.trim() } });
      if (rab.status !== 'PERLU_REVISI' && ['pencairanDana', 'pengeluaranRab'].includes(model)) {
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
    if (!['REALISASI', 'DICAIRKAN_PENUH', 'PERLU_REVISI'].includes(rab.status)) return fail(res, 409, 'LPJ belum dapat diajukan pada status ini');
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
    if (summary.sisaKas !== 0) return fail(res, 409, `Sisa kas Rp ${summary.sisaKas.toLocaleString('id-ID')} harus dikembalikan sebelum LPJ ditutup`);
    await prisma.$transaction(async (tx) => {
      await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'SELESAI', closedById: req.user.id, closedAt: new Date() } });
      await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'LPJ_DITUTUP', oldValue: { status: rab.status }, newValue: { status: 'SELESAI', ...summary }, userId: req.user.id });
    });
    res.json({ success: true, message: 'LPJ telah diverifikasi dan RAB ditutup' });
  } catch (error) {
    console.error('Close RAB Error:', error);
    fail(res, 500, 'Gagal menutup LPJ');
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
    const rab = await getRabOrFail(req.params.id);
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
      ['Nomor RAB', rab.nomorRab], ['Kegiatan', rab.namaKegiatan], ['Program Ajahan', rab.programAjahan?.nama || '-'],
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
  getDashboard, listRab, getRab, createRab, updateRab, submitRab, approveRab, rejectRab,
  addDisbursement, addExpense, verifyExpense, rejectExpense, addReturn,
  cancelDisbursement: cancelTransaction('pencairanDana', 'PENCAIRAN'),
  cancelExpense: cancelTransaction('pengeluaranRab', 'PENGELUARAN'),
  cancelReturn: cancelTransaction('pengembalianDana', 'PENGEMBALIAN'),
  submitLpj, requestRevision, closeRab,
  listCategories: listMaster('kategoriKeuangan'), listAccounts: listMaster('akunKas'), saveCategory, saveAccount,
  exportExcel, serveFile
};
