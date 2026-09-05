const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeRab } = require('../src/services/keuangan.service');

test('menghitung dana masuk, realisasi, pengembalian, sisa kas, dan sisa anggaran', () => {
  const result = summarizeRab({
    totalDisetujui: 10_000_000,
    pencairans: [
      { nominal: 8_000_000, status: 'AKTIF' },
      { nominal: 1_000_000, status: 'DIBATALKAN' }
    ],
    pengeluarans: [
      { nominal: 5_000_000, status: 'VERIFIKASI' },
      { nominal: 500_000, status: 'MENUNGGU_VERIFIKASI' },
      { nominal: 750_000, status: 'DITOLAK' }
    ],
    pengembalians: [{ nominal: 1_000_000, status: 'AKTIF' }]
  });

  assert.deepEqual(result, {
    pencairanBendahara: 8_000_000,
    danaTambahan: 0,
    penerimaanMenunggu: 0,
    danaMasuk: 8_000_000,
    pengeluaranTerverifikasi: 5_000_000,
    pengeluaranMenunggu: 500_000,
    danaDikembalikan: 1_000_000,
    sisaKas: 2_000_000,
    kasTersediaUntukInput: 1_500_000,
    sisaAnggaran: 5_000_000,
    persentaseRealisasi: 50
  });
});

test('transaksi yang dibatalkan dan ditolak tidak memengaruhi saldo', () => {
  const result = summarizeRab({
    totalDisetujui: 2_000_000,
    pencairans: [{ nominal: 2_000_000, status: 'DIBATALKAN' }],
    pengeluarans: [{ nominal: 1_000_000, status: 'DITOLAK' }],
    pengembalians: [{ nominal: 500_000, status: 'DIBATALKAN' }]
  });
  assert.equal(result.sisaKas, 0);
  assert.equal(result.sisaAnggaran, 2_000_000);
});
