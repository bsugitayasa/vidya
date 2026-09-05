const { summarizeRab } = require('./keuangan.service');

const sources = ['BENDAHARA', 'HIBAH', 'PUNIA', 'LAINNYA'];
const editableStatuses = ['DISETUJUI', 'DICAIRKAN_SEBAGIAN', 'DICAIRKAN_PENUH', 'REALISASI', 'PERLU_REVISI', 'DALAM_PENYESUAIAN'];
const jsonSafe = value => JSON.parse(JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v));
const dateBoundary = (value, end = false) => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Tanggal harus berformat YYYY-MM-DD');
  const date = new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}+08:00`);
  if (!Number.isFinite(date.getTime()) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error('Tanggal tidak valid');
  return date;
};

// The ledger covers funds entrusted to RABs. Bendahara transfers are not external income.
const buildReconciliation = (rabs, filters = {}) => {
  const start = dateBoundary(filters.dari), end = dateBoundary(filters.sampai, true);
  if (start && end && start > end) throw new Error('Tanggal awal harus sebelum tanggal akhir');
  const rows = rabs.filter(r => (!filters.status || r.status === filters.status) && (!filters.programAjahanId || r.programAjahanId === Number(filters.programAjahanId))).map(rab => {
    const ledger = [
      ...(rab.pencairans || []).filter(r => r.status === 'AKTIF').map(r => ({ ...r, jenis: 'MASUK', sumber: r.jenisSumber || 'BENDAHARA', nilai: Number(r.nominal) })),
      ...(rab.pengeluarans || []).filter(r => r.status === 'VERIFIKASI').map(r => ({ ...r, jenis: 'KELUAR', nilai: -Number(r.nominal) })),
      ...(rab.pengembalians || []).filter(r => r.status === 'AKTIF').map(r => ({ ...r, jenis: 'PENGEMBALIAN', nilai: -Number(r.nominal) }))
    ].filter(r => (!filters.akunKasId || r.akunKasId === Number(filters.akunKasId)) && (!end || new Date(r.tanggal) <= end));
    const period = ledger.filter(r => !start || new Date(r.tanggal) >= start);
    const total = (list, predicate = () => true) => list.filter(predicate).reduce((t, r) => t + r.nilai, 0);
    const saldoAwal = total(ledger.filter(r => start && new Date(r.tanggal) < start));
    const danaBendahara = total(period, r => r.jenis === 'MASUK' && r.sumber === 'BENDAHARA');
    const hibah = total(period, r => r.sumber === 'HIBAH'), punia = total(period, r => r.sumber === 'PUNIA'), lainnya = total(period, r => r.sumber === 'LAINNYA');
    const realisasi = -total(period, r => r.jenis === 'KELUAR'), pengembalian = -total(period, r => r.jenis === 'PENGEMBALIAN');
    const summary = summarizeRab(rab);
    const danaMasuk = danaBendahara + hibah + punia + lainnya;
    const sisaDana = saldoAwal + danaMasuk - realisasi - pengembalian;
    const peringatan = [];
    if (rab.status === 'SELESAI' && summary.sisaKas !== 0) peringatan.push('Selesai masih bersaldo');
    if (summary.sisaAnggaran < 0) peringatan.push('Realisasi melebihi anggaran');
    if (summary.sisaKas < 0) peringatan.push('Dana tidak mencukupi');
    if (summary.penerimaanMenunggu || summary.pengeluaranMenunggu || rab.perubahanAnggarans?.some(r => r.status === 'MENUNGGU_VERIFIKASI')) peringatan.push('Menunggu verifikasi');
    return { id: rab.id, nomorRab: rab.nomorRab, namaKegiatan: rab.namaKegiatan, status: rab.status, program: rab.programAjahan?.nama || 'Umum', anggaran: Number(rab.totalDisetujui), saldoAwal, danaBendahara, hibah, punia, lainnya, danaMasuk, realisasi, pengembalian, sisaDana, peringatan,
      transaksi: period.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal)).map(r => ({ tanggal: r.tanggal, jenis: r.jenis, sumber: r.sumber || '', nominal: Math.abs(r.nilai), akunKasId: r.akunKasId, uraian: r.uraian || r.sumberDana || r.keterangan || '', buktiPath: r.buktiPath })) };
  }).filter(r => !filters.sumberDana || r.transaksi.some(t => t.sumber === filters.sumberDana));
  const keys = ['anggaran','saldoAwal','danaBendahara','hibah','punia','lainnya','danaMasuk','realisasi','pengembalian','sisaDana'];
  return { filters, rows, totals: Object.fromEntries(keys.map(k => [k, rows.reduce((t,r) => t + r[k], 0)])), scope: 'Kas dana kelolaan RAB; pencairan bendahara dan pengembalian adalah transfer internal, bukan pendapatan/beban organisasi. Anggaran dan status adalah posisi terkini. Filter sumber memilih RAB penerima sumber tersebut dengan seluruh arus kasnya.' };
};

module.exports = { sources, editableStatuses, jsonSafe, dateBoundary, buildReconciliation };
