const router = require('express').Router();
const telegramService = require('../services/telegram.service');
const laporanService = require('../services/laporan.service');

const ALLOWED_CHAT_IDS = process.env.TELEGRAM_ALLOWED_CHAT_IDS
  ? process.env.TELEGRAM_ALLOWED_CHAT_IDS.split(',').map(id => id.trim())
  : [];

/**
 * Webhook handler untuk Telegram Bot
 */
router.post('/hook', async (req, res) => {
  // Verifikasi Secret Token jika dikonfigurasi
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.warn('Unauthorized Telegram Webhook request.');
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { message } = req.body;
  
  // Log incoming request for debugging
  if (message) {
    console.log(`Incoming Telegram message from ${message.chat.id}: ${message.text || '[Non-text]'}`);
  }

  if (!message || !message.text) {
    return res.sendStatus(200);
  }

  const chatId = String(message.chat.id);
  const text = message.text.trim().toLowerCase();

  // Hanya proses dari Chat ID yang diizinkan
  if (ALLOWED_CHAT_IDS.length > 0 && !ALLOWED_CHAT_IDS.includes(chatId)) {
    console.log(`Pesan dari Chat ID ${chatId} diabaikan (tidak terdaftar).`);
    return res.sendStatus(200);
  }

  try {
    if (text === '/summary' || text === '/ringkasan') {
      const data = await laporanService.getSummaryForBot();
      const pesan = telegramService.formatSummaryMessage(data);
      await telegramService.sendMessage(chatId, pesan);

    } else if (text === '/menunggu' || text === '/pending') {
      const data = await laporanService.getMenungguVerifikasi();
      if (data.length === 0) {
        await telegramService.sendMessage(chatId, '✅ Tidak ada pembayaran yang menunggu verifikasi saat ini.');
      } else {
        const lines = data.map((s, i) => 
          `${i + 1}. <b>${s.namaLengkap}</b> (<code>${s.nomorPendaftaran}</code>) - Rp ${s.totalPunia.toLocaleString('id-ID')}`
        ).join('\n');
        await telegramService.sendMessage(chatId, `💳 <b>Menunggu Verifikasi Pembayaran:</b>\n\n${lines}\n\n<i>Silakan cek panel admin untuk detail.</i>`);
      }

    } else if (text === '/help' || text === '/bantuan' || text === '/start') {
      const helpMsg = `
🤖 <b>VIDYA Bot Assistant</b>

Perintah yang tersedia:
/summary - Ringkasan pendaftar per program & gender
/menunggu - Daftar pembayaran yang perlu diverifikasi
/bantuan - Tampilkan bantuan ini
`.trim();
      await telegramService.sendMessage(chatId, helpMsg);
    }
  } catch (error) {
    console.error('Error handling Telegram command:', error.message);
  }

  res.sendStatus(200);
});

module.exports = router;
