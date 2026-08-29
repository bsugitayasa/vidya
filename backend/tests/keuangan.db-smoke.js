const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ROLLBACK = 'ROLLBACK_FINANCE_SMOKE_TEST';

async function main() {
  try {
    await prisma.$transaction(async (tx) => {
      const [user, kategori, akunKas] = await Promise.all([
        tx.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } }),
        tx.kategoriKeuangan.findFirst({ where: { isAktif: true } }),
        tx.akunKas.findFirst({ where: { isAktif: true } })
      ]);
      assert.ok(user, 'Diperlukan minimal satu Admin/Super Admin');
      assert.ok(kategori, 'Kategori awal belum tersedia');
      assert.ok(akunKas, 'Akun kas awal belum tersedia');

      const rab = await tx.rencanaAnggaran.create({
        data: {
          nomorRab: `SMOKE/${Date.now()}`,
          namaKegiatan: 'Smoke Test Keuangan',
          penanggungJawab: user.nama,
          tanggalMulai: new Date(),
          tanggalSelesai: new Date(),
          totalDiajukan: 1_000_000,
          totalDisetujui: 1_000_000,
          status: 'DISETUJUI',
          createdById: user.id,
          approvedById: user.id,
          approvedAt: new Date(),
          items: { create: [{ kategoriId: kategori.id, uraian: 'Keperluan Uji', volume: 1, satuan: 'paket', hargaSatuan: 1_000_000, jumlahDiajukan: 1_000_000, jumlahDisetujui: 1_000_000 }] }
        }, include: { items: true }
      });
      const pencairan = await tx.pencairanDana.create({ data: { rabId: rab.id, akunKasId: akunKas.id, tanggal: new Date(), nominal: 1_000_000, sumberDana: 'Smoke Test', createdById: user.id } });
      const pengeluaran = await tx.pengeluaranRab.create({ data: { rabId: rab.id, itemAnggaranId: rab.items[0].id, kategoriId: kategori.id, akunKasId: akunKas.id, tanggal: new Date(), uraian: 'Realisasi Uji', nominal: 750_000, metode: 'TRANSFER', status: 'VERIFIKASI', createdById: user.id, verifiedById: user.id, verifiedAt: new Date() } });
      await tx.auditKeuangan.create({ data: { entityType: 'PENGELUARAN', entityId: pengeluaran.id, action: 'DIVERIFIKASI', newValue: { rabId: rab.id, nominal: 750000 }, userId: user.id } });
      const auditRows = await tx.auditKeuangan.findMany({ where: { newValue: { path: ['rabId'], equals: rab.id } } });
      assert.equal(Number(pencairan.nominal), 1_000_000);
      assert.equal(Number(pengeluaran.nominal), 750_000);
      assert.equal(auditRows.length, 1);
      throw new Error(ROLLBACK);
    }, { timeout: 15000 });
  } catch (error) {
    if (error.message !== ROLLBACK) throw error;
  }
  console.log('Finance database smoke test passed; test data rolled back.');
}

main().finally(() => prisma.$disconnect());
