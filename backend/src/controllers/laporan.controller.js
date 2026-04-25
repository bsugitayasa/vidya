const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getLaporanSisya = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const whereClause = {};

    if (status && status !== 'SEMUA') {
      whereClause.statusPembayaran = status;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    const sisyas = await prisma.sisya.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        programSisyas: {
          include: {
            programAjahan: true
          }
        }
      }
    });

    res.json({ success: true, data: sisyas });
  } catch (error) {
    console.error('Get Laporan Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data laporan' });
  }
};

module.exports = {
  getLaporanSisya
};
