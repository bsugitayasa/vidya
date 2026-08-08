const { PrismaClient } = require('@prisma/client');
const { getProgramParticipationSummary } = require('../services/pendaftarStats.service');

const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    const { programId } = req.query;

    // Base filter: exclude TIDAK_AKTIF sisya from all stats
    const activeFilter = { status: { not: 'TIDAK_AKTIF' } };

    // Statistics for general dashboard
    const totalSisya = await prisma.sisya.count({ where: activeFilter });
    
    const menungguVerifikasi = await prisma.sisya.count({
      where: { ...activeFilter, statusPembayaran: 'MENUNGGU_VERIFIKASI' }
    });

    const belumLunas = await prisma.sisya.count({
      where: { 
        ...activeFilter,
        statusPembayaran: {
          in: ['BELUM_LUNAS', 'MENUNGGU_PEMBAYARAN']
        }
      }
    });
    
    // Total Punia (Hindari double count untuk pasangan Kawikon, partnerId harus null)
    const result = await prisma.sisya.aggregate({
      where: { ...activeFilter, partnerId: null },
      _sum: { totalPunia: true },
    });
    
    const totalPunia = result._sum.totalPunia || 0;

    // Gender Stats (Filtered by Program if provided)
    const genderFilter = { ...activeFilter };
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

    // Persebaran sisya unik berdasarkan kabupaten/kota, mengikuti filter program aktif.
    const locationSisyas = await prisma.sisya.findMany({
      where: genderFilter,
      select: { namaKabupaten: true }
    });

    // Gabungkan variasi kapitalisasi/spasi agar satu kabupaten tidak terpecah menjadi beberapa baris.
    const locationMap = new Map();
    locationSisyas.forEach(({ namaKabupaten }) => {
      const label = namaKabupaten?.trim() || 'Belum ditentukan';

      const key = label.toLocaleLowerCase('id-ID');
      const current = locationMap.get(key) || { namaKabupaten: label, total: 0 };
      current.total += 1;
      locationMap.set(key, current);
    });

    const sortedLocationStats = Array.from(locationMap.values()).sort((a, b) =>
      b.total - a.total || a.namaKabupaten.localeCompare(b.namaKabupaten, 'id-ID')
    );
    const locationStats = sortedLocationStats.slice(0, 10);

    if (sortedLocationStats.length > 10) {
      locationStats.push({
        namaKabupaten: 'Kabupaten/Kota lainnya',
        total: sortedLocationStats.slice(10).reduce((sum, item) => sum + item.total, 0)
      });
    }

    // Kepesertaan program dihitung terpisah dari jumlah orang unik.
    const participationSummary = await getProgramParticipationSummary(prisma);
    const programStats = participationSummary.perProgram.map(({ id, nama, total }) => ({ id, nama, total }));

    // Ambil data pendaftar 7 hari terakhir untuk grafik
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentSisyas = await prisma.sisya.findMany({
      where: {
        ...activeFilter,
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        createdAt: true,
        totalPunia: true,
        partnerId: true
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
        // Hanya hitung punia jika bukan "child" partner (untuk menghindari double count)
        if (s.partnerId === null) {
          chartMap[dateStr].punia += s.totalPunia;
        }
      }
    });

    const chartData = Object.values(chartMap);

    res.json({
      success: true,
      data: {
        totalSisya,
        totalKepesertaanProgram: participationSummary.totalKepesertaanProgram,
        totalSisyaMultiProgram: participationSummary.totalSisyaMultiProgram,
        totalKepesertaanTambahan: participationSummary.totalKepesertaanTambahan,
        menungguVerifikasi,
        belumLunas,
        totalEstimasiPunia: totalPunia,
        chartData,
        locationStats,
        genderStats: {
          lakiLaki: maleCount,
          perempuan: femaleCount
        },
        programStats,
        programList: participationSummary.perProgram.map(({ id, nama }) => ({ id, nama }))
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
