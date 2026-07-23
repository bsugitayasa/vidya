const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

/**
 * Admin memverifikasi bukti transfer dan menginput nominal
 */
const verifikasiPembayaran = async (req, res) => {
  try {
    const { id } = req.params; // ID Pembayaran
    const { nominal, status, keterangan } = req.body;

    if (!['VERIFIKASI', 'DITOLAK'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const pembayaran = await prisma.$transaction(async (tx) => {
      // 1. Update status pembayaran
      const updatedPembayaran = await tx.pembayaran.update({
        where: { id: parseInt(id) },
        data: {
          nominal: status === 'VERIFIKASI' ? parseInt(nominal) : 0,
          status,
          keterangan,
          verifiedAt: new Date()
        }
      });

      // 2. Ambil data Sisya beserta partner
      const sisya = await tx.sisya.findUnique({
        where: { id: updatedPembayaran.sisyaId },
        include: { partner: true, partnerOf: true }
      });

      const isLinked = !!(sisya.partnerId || sisya.partnerOf);
      const partnerId = sisya.partnerId || sisya.partnerOf?.id;
      const sisyaIds = isLinked ? [sisya.id, partnerId] : [sisya.id];

      // 3. Hitung ulang total terbayar untuk Sisya (dan partner jika ada)
      const allVerified = await tx.pembayaran.findMany({
        where: {
          sisyaId: { in: sisyaIds },
          status: 'VERIFIKASI'
        }
      });

      const totalTerbayar = allVerified.reduce((acc, curr) => acc + curr.nominal, 0);

      // Cek apakah masih ada bukti yang menunggu verifikasi (dari keduanya jika dilink)
      const pendingCount = await tx.pembayaran.count({
        where: {
          sisyaId: { in: sisyaIds },
          status: 'MENUNGGU'
        }
      });

      // 4. Tentukan status pembayaran Sisya
      let statusPembayaranSisya = 'MENUNGGU_PEMBAYARAN';
      
      if (totalTerbayar >= sisya.totalPunia) {
        statusPembayaranSisya = 'LUNAS';
      } else if (totalTerbayar > 0) {
        statusPembayaranSisya = pendingCount > 0 ? 'MENUNGGU_VERIFIKASI' : 'BELUM_LUNAS';
      } else if (pendingCount > 0) {
        statusPembayaranSisya = 'MENUNGGU_VERIFIKASI';
      } else if (status === 'DITOLAK') {
        statusPembayaranSisya = 'DITOLAK';
      }

      // 5. Update Sisya dan Partner
      await tx.sisya.updateMany({
        where: { id: { in: sisyaIds } },
        data: {
          totalTerbayar,
          statusPembayaran: statusPembayaranSisya
        }
      });

      return updatedPembayaran;
    });

    res.json({ success: true, message: 'Pembayaran berhasil diverifikasi', data: pembayaran });

  } catch (error) {
    console.error('Verifikasi Pembayaran Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi pembayaran' });
  }
};

/**
 * Sisya/Public mengunggah bukti bayar baru (cicilan)
 */
const uploadBuktiBayar = async (req, res) => {
  try {
    const { sisyaId } = req.params;
    const { keterangan } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File bukti harus diunggah' });
    }

    const newPembayaran = await prisma.$transaction(async (tx) => {
      const pembayaran = await tx.pembayaran.create({
        data: {
          sisyaId: parseInt(sisyaId),
          buktiPath: `/uploads/${req.file.filename}`,
          keterangan: keterangan || 'Pembayaran cicilan',
          status: 'MENUNGGU'
        }
      });

      // Update status sisya (dan partner) menjadi MENUNGGU_VERIFIKASI
      const sisya = await tx.sisya.findUnique({
        where: { id: parseInt(sisyaId) },
        include: { partner: true, partnerOf: true }
      });
      const isLinked = !!(sisya.partnerId || sisya.partnerOf);
      const partnerId = sisya.partnerId || sisya.partnerOf?.id;
      const sisyaIds = isLinked ? [sisya.id, partnerId] : [sisya.id];

      await tx.sisya.updateMany({
        where: { id: { in: sisyaIds } },
        data: { statusPembayaran: 'MENUNGGU_VERIFIKASI' }
      });

      return pembayaran;
    });

    // Telegram Notification (Non-blocking)
    try {
      const telegramService = require('../services/telegram.service');
      const sisya = await prisma.sisya.findUnique({
        where: { id: parseInt(sisyaId) }
      });
      const pesan = telegramService.formatNotifikasiBuktiPunia(sisya);
      telegramService.sendMessage(process.env.TELEGRAM_CHANNEL_ID, pesan).catch(err => console.error('Telegram Notif Error:', err));
    } catch (e) {
      console.error('Gagal menyiapkan notifikasi Telegram:', e);
    }

    res.status(201).json({ success: true, message: 'Bukti berhasil diunggah', data: newPembayaran });

  } catch (error) {
    console.error('Upload Bukti Error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Gagal mengunggah bukti' });
  }
};

const deletePembayaran = async (req, res) => {
    try {
        const { id } = req.params;
        const pembayaran = await prisma.pembayaran.findUnique({ where: { id: parseInt(id) } });
        
        if (!pembayaran) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        if (pembayaran.status === 'VERIFIKASI') return res.status(400).json({ success: false, message: 'Tidak bisa menghapus pembayaran yang sudah diverifikasi' });

        // Hapus file
        const filePath = path.join(__dirname, '../../', pembayaran.buktiPath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await prisma.pembayaran.delete({ where: { id: parseInt(id) } });

        res.json({ success: true, message: 'Data pembayaran berhasil dihapus' });
    } catch (error) {
        console.error('Delete Pembayaran Error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus data' });
    }
}

const editPembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { nominal, keterangan } = req.body;

    const updatedPembayaran = await prisma.$transaction(async (tx) => {
      // Update nominal and keterangan of the pembayaran
      const pembayaran = await tx.pembayaran.update({
        where: { id: parseInt(id) },
        data: {
          nominal: parseInt(nominal),
          keterangan,
        },
      });

      // Fetch related sisya (and partner if linked)
      const sisya = await tx.sisya.findUnique({
        where: { id: pembayaran.sisyaId },
        include: { partner: true, partnerOf: true },
      });

      const isLinked = !!(sisya.partnerId || sisya.partnerOf);
      const partnerId = sisya.partnerId || sisya.partnerOf?.id;
      const sisyaIds = isLinked ? [sisya.id, partnerId] : [sisya.id];

      // Recalculate total terbayar from verified payments
      const allVerified = await tx.pembayaran.findMany({
        where: {
          sisyaId: { in: sisyaIds },
          status: 'VERIFIKASI',
        },
      });
      const totalTerbayar = allVerified.reduce((acc, cur) => acc + cur.nominal, 0);

      // Count pending payments (still awaiting verification)
      const pendingCount = await tx.pembayaran.count({
        where: {
          sisyaId: { in: sisyaIds },
          status: 'MENUNGGU',
        },
      });

      // Determine new status pembayaran for sisya
      let statusPembayaranSisya = 'MENUNGGU_PEMBAYARAN';
      if (totalTerbayar >= sisya.totalPunia) {
        statusPembayaranSisya = 'LUNAS';
      } else if (totalTerbayar > 0) {
        statusPembayaranSisya = pendingCount > 0 ? 'MENUNGGU_VERIFIKASI' : 'BELUM_LUNAS';
      } else if (pendingCount > 0) {
        statusPembayaranSisya = 'MENUNGGU_VERIFIKASI';
      }

      // Update sisya (and partner) with new totals and status
      await tx.sisya.updateMany({
        where: { id: { in: sisyaIds } },
        data: {
          totalTerbayar,
          statusPembayaran: statusPembayaranSisya,
        },
      });

      return pembayaran;
    });

    res.json({ success: true, message: 'Pembayaran berhasil diedit', data: updatedPembayaran });
  } catch (error) {
    console.error('Edit Pembayaran Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengedit pembayaran' });
  }
};

module.exports = {
  verifikasiPembayaran,
  uploadBuktiBayar,
  deletePembayaran,
  editPembayaran
};
