const { PrismaClient } = require('@prisma/client');
const { getProgramParticipationSummary } = require('./pendaftarStats.service');
const prisma = new PrismaClient();

/**
 * Mendapatkan ringkasan data untuk Bot Telegram
 */
const getSummaryForBot = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Total Sisya
  const total = await prisma.sisya.count({
    where: { status: { not: 'TIDAK_AKTIF' } }
  });
  
  // Sisya Bulan Ini
  const bulanIni = await prisma.sisya.count({
    where: { 
      createdAt: { gte: startOfMonth },
      status: { not: 'TIDAK_AKTIF' }
    }
  });

  // Sisya Hari Ini
  const hariIni = await prisma.sisya.count({
    where: { 
      createdAt: { gte: startOfDay },
      status: { not: 'TIDAK_AKTIF' }
    }
  });

  const participationSummary = await getProgramParticipationSummary(prisma);

  return {
    total,
    bulanIni,
    hariIni,
    perProgram: participationSummary.perProgram,
    totalKepesertaanProgram: participationSummary.totalKepesertaanProgram,
    totalSisyaMultiProgram: participationSummary.totalSisyaMultiProgram,
    totalKepesertaanTambahan: participationSummary.totalKepesertaanTambahan
  };
};

/**
 * Mendapatkan daftar sisya menunggu verifikasi pembayaran
 */
const getMenungguVerifikasi = async () => {
  return await prisma.sisya.findMany({
    where: { 
      statusPembayaran: 'MENUNGGU_VERIFIKASI',
      status: { not: 'TIDAK_AKTIF' }
    },
    orderBy: { updatedAt: 'asc' },
    select: {
      namaLengkap: true,
      nomorPendaftaran: true,
      totalPunia: true
    }
  });
};

module.exports = {
  getSummaryForBot,
  getMenungguVerifikasi
};
