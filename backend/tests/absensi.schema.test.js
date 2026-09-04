const test = require('node:test');
const assert = require('node:assert/strict');
const { createSesiSchema } = require('../../shared/schemas/absensi.schema');

test('schema pembuatan sesi mempertahankan Narawakya dan topik', () => {
  const result = createSesiSchema.parse({
    mataKuliahId: 12,
    tanggal: '2026-09-05',
    pertemuan: 3,
    topik: '  Pengenalan Mantra Dasar  ',
    narawakya: '  Ida Pedanda Gede  '
  });

  assert.equal(result.topik, 'Pengenalan Mantra Dasar');
  assert.equal(result.narawakya, 'Ida Pedanda Gede');
});

test('schema pembuatan sesi menerima field opsional yang kosong', () => {
  const result = createSesiSchema.parse({
    mataKuliahId: 12,
    tanggal: '2026-09-05',
    pertemuan: 3,
    topik: null,
    narawakya: null
  });

  assert.equal(result.topik, null);
  assert.equal(result.narawakya, null);
});
