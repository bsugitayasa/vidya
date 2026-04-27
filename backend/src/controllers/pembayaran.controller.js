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

      // 2. Hitung ulang total terbayar untuk Sisya
      const allVerified = await tx.pembayaran.findMany({
        where: {
          sisyaId: updatedPembayaran.sisyaId,
          status: 'VERIFIKASI'
        }
      });

      const totalTerbayar = allVerified.reduce((acc, curr) => acc + curr.nominal, 0);

      // 3. Ambil data Sisya untuk bandingkan dengan total tagihan
      const sisya = await tx.sisya.findUnique({
        where: { id: updatedPembayaran.sisyaId }
      });

      // 4. Tentukan status pembayaran Sisya
      let statusPembayaranSisya = 'MENUNGGU_PEMBAYARAN';
      
      // Cek apakah masih ada bukti yang menunggu verifikasi
      const pendingCount = await tx.pembayaran.count({
        where: {
          sisyaId: updatedPembayaran.sisyaId,
          status: 'MENUNGGU'
        }
      });

      if (totalTerbayar >= sisya.totalPunia) {
        statusPembayaranSisya = 'LUNAS';
      } else if (totalTerbayar > 0) {
        statusPembayaranSisya = pendingCount > 0 ? 'MENUNGGU_VERIFIKASI' : 'BELUM_LUNAS';
      } else if (pendingCount > 0) {
        statusPembayaranSisya = 'MENUNGGU_VERIFIKASI';
      } else if (status === 'DITOLAK') {
        statusPembayaranSisya = 'DITOLAK';
      }

      await tx.sisya.update({
        where: { id: updatedPembayaran.sisyaId },
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

      // Update status sisya menjadi MENUNGGU_VERIFIKASI
      await tx.sisya.update({
        where: { id: parseInt(sisyaId) },
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

module.exports = {
  verifikasiPembayaran,
  uploadBuktiBayar,
    deletePembayaran
};
