const ExcelJS = require('exceljs');
const { rabInclude, withSummary, summarizeRab, audit } = require('../services/keuangan.service');
const { sources, editableStatuses, jsonSafe, dateBoundary, buildReconciliation } = require('../services/rekonsiliasi.service');
const { prisma } = require('../services/finance-db');
const guard = fn => async (req, res) => { try { await fn(req, res); } catch (e) { console.error('Finance adjustment:', e.message); res.status(e.status || (e.code === 'P2034' ? 409 : 400)).json({ success: false, message: e.code === 'P2034' ? 'Data berubah saat diproses. Muat ulang lalu coba kembali.' : e.message }); } };
const requireValue = (ok, message, status = 400) => { if (!ok) throw Object.assign(new Error(message), { status }); };
const positiveId = value => { const id = Number(value); requireValue(Number.isSafeInteger(id) && id > 0, 'ID tidak valid'); return id; };
const amount = (value, zero = false) => { const n = Number(value); requireValue(value !== '' && value != null && Number.isSafeInteger(n) && (zero ? n >= 0 : n > 0), 'Nominal harus berupa rupiah bulat yang valid'); return n; };
const reason = body => { requireValue(typeof body.alasan === 'string' && body.alasan.trim().length >= 5, 'Alasan minimal 5 karakter wajib diisi'); return body.alasan.trim(); };
const transact = fn => prisma.$transaction(fn, { isolationLevel: 'Serializable', timeout: 20000 });
const getRab = async (tx, id) => { const rab = await tx.rencanaAnggaran.findUnique({ where: { id: positiveId(id) }, include: rabInclude }); requireValue(rab, 'RAB tidak ditemukan', 404); return rab; };
const editable = rab => requireValue(editableStatuses.includes(rab.status), 'RAB harus dibuka untuk penyesuaian sebelum transaksi diubah', 409);
const assertUnusedQr = async (tx, id) => {
  if (!id) return;
  const archives = await tx.arsipLpj.count({ where: { OR: [{ snapshot: { path: ['rabQrDocumentId'], equals: String(id) } }, { snapshot: { path: ['lpjQrDocumentId'], equals: String(id) } }] } });
  requireValue(!archives, 'QR ini sudah terikat pada versi arsip. Pilih QR baru untuk revisi dokumen.', 409);
};

const reopen = guard(async (req, res) => {
  requireValue(req.user.role === 'SUPER_ADMIN', 'Hanya SUPER_ADMIN dapat membuka penyesuaian', 403);
  const alasan = reason(req.body);
  await transact(async tx => {
    const rab = await getRab(tx, req.params.id);
    requireValue(rab.status === 'SELESAI', 'Hanya RAB selesai yang dapat dibuka kembali', 409);
    const { arsips, perubahanAnggarans, ...snapshot } = withSummary(rab);
    await tx.arsipLpj.create({ data: { rabId: rab.id, revision: rab.revision, snapshot: jsonSafe(snapshot), alasan, userId: req.user.id } });
    await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'DALAM_PENYESUAIAN', revision: { increment: 1 }, closedAt: null, closedById: null, lpjQrDocumentId: null } });
    await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'PENYESUAIAN_DIBUKA', oldValue: { status: rab.status, revision: rab.revision }, newValue: { status: 'DALAM_PENYESUAIAN', revision: rab.revision + 1 }, reason: alasan, userId: req.user.id });
  });
  res.json({ success: true, message: 'Penyesuaian dibuka; LPJ sebelumnya tersimpan sebagai arsip' });
});

const archive = guard(async (req, res) => {
  const row = await prisma.arsipLpj.findFirst({ where: { id: positiveId(req.params.archiveId), rabId: positiveId(req.params.id) } });
  requireValue(row, 'Arsip tidak ditemukan', 404);
  res.json({ success: true, data: row.snapshot });
});

const receive = guard(async (req, res) => {
  const nominal = amount(req.body.nominal), akunKasId = positiveId(req.body.akunKasId);
  const jenisSumber = req.body.jenisSumber || 'BENDAHARA';
  requireValue(sources.includes(jenisSumber), 'Jenis sumber dana tidak valid');
  const tanggal = dateBoundary(req.body.tanggal); requireValue(tanggal, 'Tanggal penerimaan wajib diisi');
  await transact(async tx => {
    const rab = await getRab(tx, req.params.id); editable(rab);
    requireValue(await tx.akunKas.count({ where: { id: akunKasId, isAktif: true } }), 'Akun kas tidak aktif');
    const row = await tx.pencairanDana.create({ data: { rabId: rab.id, akunKasId, tanggal, nominal, jenisSumber, sumberDana: String(req.body.sumberDana || jenisSumber).trim(), nomorReferensi: req.body.nomorReferensi || null, keterangan: req.body.keterangan || null, buktiPath: req.file ? `/uploads/${req.file.filename}` : null, status: 'MENUNGGU_VERIFIKASI', createdById: req.user.id } });
    await audit(tx, { entityType: 'PENCAIRAN', entityId: row.id, action: 'PENERIMAAN_DIAJUKAN', newValue: { rabId: rab.id, nominal, jenisSumber }, userId: req.user.id });
  });
  res.status(201).json({ success: true, message: 'Dana masuk dicatat dan menunggu verifikasi sebelum menambah kas' });
});

const verifyReceipt = guard(async (req, res) => {
  await transact(async tx => {
    const row = await tx.pencairanDana.findUnique({ where: { id: positiveId(req.params.id) } });
    requireValue(row, 'Penerimaan tidak ditemukan', 404);
    requireValue(row.status === 'MENUNGGU_VERIFIKASI', 'Penerimaan sudah diproses', 409);
    const rab = await getRab(tx, row.rabId); editable(rab);
    await tx.pencairanDana.update({ where: { id: row.id }, data: { status: 'AKTIF', verifiedById: req.user.id, verifiedAt: new Date() } });
    if (rab.status === 'DISETUJUI') await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { status: 'DICAIRKAN_SEBAGIAN' } });
    await audit(tx, { entityType: 'PENCAIRAN', entityId: row.id, action: 'PENERIMAAN_DIVERIFIKASI', oldValue: { status: row.status }, newValue: { rabId: rab.id, status: 'AKTIF', nominal: Number(row.nominal) }, userId: req.user.id });
  });
  res.json({ success: true, message: 'Penerimaan diverifikasi dan saldo kas bertambah' });
});

const proposeBudget = guard(async (req, res) => {
  const alasan = reason(req.body);
  requireValue(Array.isArray(req.body.items) && req.body.items.length > 0, 'Minimal satu komponen wajib diisi');
  await transact(async tx => {
    const rab = await getRab(tx, req.params.id); editable(rab);
    requireValue(!rab.perubahanAnggarans.some(p => p.status === 'MENUNGGU_VERIFIKASI'), 'Masih ada penyesuaian anggaran menunggu verifikasi', 409);
    const ids = new Set();
    const items = req.body.items.map(item => {
      const id = item.id ? positiveId(item.id) : null;
      if (id) { requireValue(rab.items.some(r => r.id === id) && !ids.has(id), 'Komponen tidak valid atau duplikat'); ids.add(id); }
      requireValue(item.uraian?.trim() && item.satuan?.trim(), 'Uraian dan satuan wajib diisi');
      const volume = Number(item.volume); requireValue(Number.isFinite(volume) && volume > 0 && Math.abs(Math.round(volume * 100) - volume * 100) < 0.000001, 'Volume maksimal dua desimal');
      const hargaSatuan = amount(item.hargaSatuan);
      return { id, kategoriId: item.kategoriId ? positiveId(item.kategoriId) : null, uraian: item.uraian.trim(), satuan: item.satuan.trim(), volume, hargaSatuan, jumlahDiajukan: amount(Math.round(volume * hargaSatuan)) };
    });
    const row = await tx.perubahanAnggaran.create({ data: { rabId: rab.id, items, alasan, userId: req.user.id } });
    await audit(tx, { entityType: 'RAB', entityId: rab.id, action: 'ANGGARAN_PENYESUAIAN_DIAJUKAN', newValue: { proposalId: row.id, items }, reason: alasan, userId: req.user.id });
  });
  res.json({ success: true, message: 'Penyesuaian komponen diajukan; anggaran berubah setelah disetujui' });
});

const decideBudget = guard(async (req, res) => {
  requireValue(['DISETUJUI', 'DITOLAK'].includes(req.body.status), 'Keputusan tidak valid');
  const alasan = reason(req.body);
  await transact(async tx => {
    const row = await tx.perubahanAnggaran.findUnique({ where: { id: positiveId(req.params.id) } });
    requireValue(row && row.status === 'MENUNGGU_VERIFIKASI', 'Penyesuaian sudah diproses atau tidak ditemukan', 409);
    const rab = await getRab(tx, row.rabId); editable(rab);
    if (req.body.status === 'DISETUJUI') {
      for (const [index, item] of row.items.entries()) {
        const { id, ...data } = item;
        const used = rab.pengeluarans.filter(e => e.itemAnggaranId === id && ['VERIFIKASI','MENUNGGU_VERIFIKASI'].includes(e.status)).reduce((t,e) => t + Number(e.nominal), 0);
        requireValue(!id || data.jumlahDiajukan >= used, 'Anggaran komponen tidak boleh kurang dari realisasi dan pengeluaran menunggu verifikasi');
        if (id) await tx.itemAnggaran.update({ where: { id }, data: { ...data, jumlahDisetujui: data.jumlahDiajukan } });
        else await tx.itemAnggaran.create({ data: { ...data, rabId: rab.id, urutan: rab.items.length + index, jumlahDisetujui: data.jumlahDiajukan } });
      }
      const total = await tx.itemAnggaran.aggregate({ where: { rabId: rab.id }, _sum: { jumlahDisetujui: true, jumlahDiajukan: true } });
      await tx.rencanaAnggaran.update({ where: { id: rab.id }, data: { totalDisetujui: total._sum.jumlahDisetujui, totalDiajukan: total._sum.jumlahDiajukan, rabQrDocumentId: null } });
    }
    await tx.perubahanAnggaran.update({ where: { id: row.id }, data: { status: req.body.status, verifiedById: req.user.id, verifiedAt: new Date() } });
    await audit(tx, { entityType: 'RAB', entityId: rab.id, action: `ANGGARAN_PENYESUAIAN_${req.body.status}`, oldValue: jsonSafe({ items: rab.items, totalDisetujui: rab.totalDisetujui }), newValue: { proposalId: row.id, items: row.items }, reason: alasan, userId: req.user.id });
  });
  res.json({ success: true, message: 'Keputusan penyesuaian anggaran tersimpan' });
});

const reportData = async (db, filters) => buildReconciliation(await db.rencanaAnggaran.findMany({ include: { programAjahan: true, pencairans: true, pengeluarans: true, pengembalians: true, perubahanAnggarans: true }, orderBy: { nomorRab: 'asc' } }), filters);
const report = guard(async (req, res) => res.json({ success: true, data: await reportData(prisma, req.query) }));
const exportExcel = guard(async (req, res) => {
  const data = await reportData(prisma, req.query), book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Rekonsiliasi RAB');
  const keys = ['nomorRab','namaKegiatan','status','anggaran','saldoAwal','danaBendahara','hibah','punia','lainnya','danaMasuk','realisasi','pengembalian','sisaDana'];
  const labels = ['Nomor RAB','Kegiatan','Status','Anggaran terkini','Saldo Awal','Bendahara','Hibah','Punia','Lainnya','Total Masuk','Realisasi','Pengembalian','Sisa Dana'];
  sheet.addRow(['REKONSILIASI DANA KELOLAAN RAB']);
  sheet.addRow([`Periode: ${req.query.dari || 'Awal pencatatan'} s.d. ${req.query.sampai || 'Semua tanggal'}`]);
  sheet.addRow([data.scope]); sheet.addRow([`Filter: ${JSON.stringify(req.query)}`]); sheet.addRow(labels);
  data.rows.forEach(row => sheet.addRow(keys.map(k => row[k])));
  sheet.addRow(keys.map(k => k === 'nomorRab' ? 'TOTAL' : data.totals[k] ?? ''));
  sheet.columns.forEach((c,i) => { c.width = i === 1 ? 38 : 24; if (i >= 3) c.numFmt = '#,##0;[Red](#,##0)'; });
  sheet.getRow(5).font = { bold: true }; sheet.views = [{ state: 'frozen', ySplit: 5 }];
  const detail = book.addWorksheet('Transaksi'); detail.addRow(['RAB','Tanggal','Jenis','Sumber','Uraian','Nominal','Bukti']);
  data.rows.forEach(r => r.transaksi.forEach(t => detail.addRow([r.nomorRab, new Date(t.tanggal), t.jenis, t.sumber, t.uraian, t.nominal, t.buktiPath || 'Belum tersedia'])));
  detail.columns.forEach(c => { c.width = 24; }); detail.getColumn(2).numFmt = 'dd/mm/yyyy'; detail.getColumn(6).numFmt = '#,##0';
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', 'attachment; filename="Rekonsiliasi-RAB.xlsx"'); await book.xlsx.write(res); res.end();
});

const cashChecks = guard(async (req, res) => {
  const rows = await prisma.rekonsiliasiKas.findMany({ include: { akunKas: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ success: true, data: rows });
});
const saveCashCheck = guard(async (req, res) => {
  const akunKasId = positiveId(req.body.akunKasId), saldoAktual = amount(req.body.saldoAktual, true), tanggal = dateBoundary(req.body.tanggal, true);
  requireValue(tanggal, 'Tanggal pemeriksaan wajib diisi'); const catatan = reason(req.body);
  await transact(async tx => {
    requireValue(await tx.akunKas.count({ where: { id: akunKasId } }), 'Akun kas tidak ditemukan');
    const report = await reportData(tx, { akunKasId: String(akunKasId), sampai: req.body.tanggal });
    const row = await tx.rekonsiliasiKas.create({ data: { akunKasId, tanggal, saldoSistem: report.totals.sisaDana, saldoAktual, catatan, userId: req.user.id } });
    await audit(tx, { entityType: 'REKONSILIASI_KAS', entityId: row.id, action: 'DIPERIKSA', newValue: jsonSafe(row), userId: req.user.id });
  });
  res.json({ success: true, message: 'Hasil pemeriksaan kas tersimpan; selisih tidak otomatis menjadi transaksi' });
});

module.exports = { reopen, archive, receive, verifyReceipt, proposeBudget, decideBudget, report, exportExcel, cashChecks, saveCashCheck, assertUnusedQr };
