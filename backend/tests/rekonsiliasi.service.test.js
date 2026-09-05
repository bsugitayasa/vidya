const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeRab } = require('../src/services/keuangan.service');
const { buildReconciliation, dateBoundary } = require('../src/services/rekonsiliasi.service');
const receipt = (nominal, jenisSumber, tanggal, status='AKTIF', akunKasId=1) => ({ nominal, jenisSumber, tanggal, status, akunKasId });
const rab = { id:1, nomorRab:'RAB/TEST', namaKegiatan:'Kegiatan', totalDisetujui:10_000_000, status:'REALISASI',
  pencairans:[receipt(10_000_000,'BENDAHARA','2026-08-10'),receipt(2_000_000,'PUNIA','2026-09-01'),receipt(5_000_000,'HIBAH','2026-09-02','MENUNGGU_VERIFIKASI')],
  pengeluarans:[{nominal:10_500_000,status:'VERIFIKASI',tanggal:'2026-09-03',akunKasId:1}],
  pengembalians:[{nominal:500_000,status:'AKTIF',tanggal:'2026-09-04',akunKasId:1}]
};
test('tambahan punia menambah kas tanpa mengubah anggaran; pending tidak dihitung',()=>{
  const s=summarizeRab(rab);
  assert.equal(s.danaMasuk,12_000_000);assert.equal(s.danaTambahan,2_000_000);assert.equal(s.penerimaanMenunggu,5_000_000);
  assert.equal(s.sisaKas,1_000_000);assert.equal(s.sisaAnggaran,-500_000);
});
test('rekonsiliasi membawa dana bulan lalu ke saldo awal dan menghindari hitung ganda',()=>{
  const {totals,rows}=buildReconciliation([rab],{dari:'2026-09-01',sampai:'2026-09-30'});
  assert.equal(totals.saldoAwal,10_000_000);assert.equal(totals.danaBendahara,0);assert.equal(totals.danaMasuk,2_000_000);assert.equal(totals.sisaDana,1_000_000);
  assert.equal(totals.danaMasuk,totals.danaBendahara+totals.hibah+totals.punia+totals.lainnya);
  assert.ok(rows[0].peringatan.includes('Menunggu verifikasi'));assert.ok(rows[0].peringatan.includes('Realisasi melebihi anggaran'));
});
test('batas periode Bali, pembatalan, filter kas dan sumber dana',()=>{
  const sample={...rab,pencairans:[receipt(10,'PUNIA','2026-08-31T16:00:00Z'),receipt(20,'PUNIA','2026-09-30T16:00:00Z'),receipt(99,'PUNIA','2026-09-02','DIBATALKAN'),receipt(25,'HIBAH','2026-09-03','AKTIF',2)],pengeluarans:[],pengembalians:[]};
  const result=buildReconciliation([sample],{dari:'2026-09-01',sampai:'2026-09-30',akunKasId:'1'});
  assert.equal(result.totals.sisaDana,10);assert.equal(result.totals.saldoAwal,0);
  assert.equal(buildReconciliation([sample],{sumberDana:'LAINNYA'}).rows.length,0);
  assert.equal(buildReconciliation([sample],{sumberDana:'HIBAH'}).totals.danaMasuk,55);
});
test('tanggal salah dan periode terbalik ditolak',()=>{
  assert.throws(()=>dateBoundary('2026-02-30'));assert.throws(()=>dateBoundary('invalid'));
  assert.throws(()=>buildReconciliation([],{dari:'2026-09-30',sampai:'2026-09-01'}));
});
