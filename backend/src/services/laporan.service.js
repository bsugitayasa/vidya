const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Mendapatkan ringkasan data untuk Bot Telegram
 */
const getSummaryForBot = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Total Sisya
  const total = await prisma.sisya.count();
  
  // Sisya Bulan Ini
  const bulanIni = await prisma.sisya.count({
    where: { createdAt: { gte: startOfMonth } }
  });

  // Sisya Hari Ini
  const hariIni = await prisma.sisya.count({
    where: { createdAt: { gte: startOfDay } }
  });

  // Data per Program dan Jenis Kelamin
  const programs = await prisma.programAjahan.findMany({
    where: { isAktif: true },
    include: {
      sisyaPrograms: {
        include: {
          sisya: true
        }
      }
    }
  });

  const perProgram = programs.map(p => {
    const lakiLaki = p.sisyaPrograms.filter(sp => sp.sisya.jenisKelamin === 'LAKI_LAKI').length;
    const perempuan = p.sisyaPrograms.filter(sp => sp.sisya.jenisKelamin === 'PEREMPUAN').length;
    return {
      nama: p.nama,
      lakiLaki,
      perempuan
    };
  });

  return {
    total,
    bulanIni,
    hariIni,
    perProgram
  };
};

/**
 * Mendapatkan daftar sisya menunggu verifikasi pembayaran
 */
const getMenungguVerifikasi = async () => {
  return await prisma.sisya.findMany({
    where: { statusPembayaran: 'MENUNGGU_VERIFIKASI' },
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
