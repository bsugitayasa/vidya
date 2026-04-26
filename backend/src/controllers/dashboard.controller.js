const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    const { programId } = req.query;

    // Statistics for general dashboard
    const totalSisya = await prisma.sisya.count();
    
    const menungguVerifikasi = await prisma.sisya.count({
      where: { statusPembayaran: 'MENUNGGU_VERIFIKASI' }
    });

    const belumLunas = await prisma.sisya.count({
      where: { 
        statusPembayaran: {
          in: ['BELUM_LUNAS', 'MENUNGGU_PEMBAYARAN']
        }
      }
    });
    
    // Total Punia
    const result = await prisma.sisya.aggregate({
      _sum: { totalPunia: true },
    });
    
    const totalPunia = result._sum.totalPunia || 0;

    // Gender Stats (Filtered by Program if provided)
    const genderFilter = {};
    if (programId && programId !== 'all') {
      genderFilter.programSisyas = {
        some: { programAjahanId: parseInt(programId) }
      };
    }

    const maleCount = await prisma.sisya.count({
      where: { ...genderFilter, jenisKelamin: 'LAKI_LAKI' }
    });
    const femaleCount = await prisma.sisya.count({
      where: { ...genderFilter, jenisKelamin: 'PEREMPUAN' }
    });

    // Program Stats
    const programsData = await prisma.programAjahan.findMany({
      where: { isAktif: true },
      select: {
        id: true,
        nama: true,
        _count: {
          select: { sisyaPrograms: true }
        }
      },
      orderBy: { urutan: 'asc' }
    });

    const programStats = programsData.map(p => ({
      id: p.id,
      nama: p.nama,
      total: p._count.sisyaPrograms
    }));

    // Ambil data pendaftar 7 hari terakhir untuk grafik
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentSisyas = await prisma.sisya.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        createdAt: true,
        totalPunia: true
      }
    });

    // Kelompokkan berdasarkan tanggal
    const chartMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      chartMap[dateStr] = { date: dateStr, pendaftar: 0, punia: 0 };
    }

    recentSisyas.forEach(s => {
      const dateStr = new Date(s.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      if (chartMap[dateStr]) {
        chartMap[dateStr].pendaftar += 1;
        chartMap[dateStr].punia += s.totalPunia;
      }
    });

    const chartData = Object.values(chartMap);

    res.json({
      success: true,
      data: {
        totalSisya,
        menungguVerifikasi,
        belumLunas,
        totalEstimasiPunia: totalPunia,
        chartData,
        genderStats: {
          lakiLaki: maleCount,
          perempuan: femaleCount
        },
        programStats,
        programList: programsData.map(p => ({ id: p.id, nama: p.nama }))
      }
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  getStats
};
