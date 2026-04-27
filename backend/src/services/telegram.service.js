const axios = require('axios');

/**
 * Kirim pesan ke Telegram
 */
const sendMessage = async (chatId, text, options = {}) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_API = `https://api.telegram.org/bot${token}`;

  if (!token || !chatId) {
    console.warn('Telegram Bot Token atau Chat ID tidak dikonfigurasi.');
    return;
  }

  console.log(`Mengirim pesan Telegram ke ${chatId}...`);

  try {
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options
    });
    console.log('Pesan Telegram berhasil terkirim.');
    return response.data;
  } catch (error) {
    console.error('Gagal mengirim pesan Telegram:', error.response?.data || error.message);
    // throw error; // Kita tidak ingin menghentikan proses utama jika notif gagal
  }
};

/**
 * Format notifikasi pendaftaran baru
 */
const formatNotifikasiRegistrasi = (sisya) => {
  const programLines = sisya.programSisyas
    .map(p => `• ${p.programAjahan.nama}${p.isPasangan ? ' (+Pasangan)' : ''} — Rp ${p.puniaProgram.toLocaleString('id-ID')}`)
    .join('\n');

  return `
🪷 <b>Sisya Baru Mendaftar!</b>

👤 <b>Nama</b>: ${sisya.namaLengkap}
🏠 <b>Griya</b>: ${sisya.namaGriya}
📱 <b>No HP</b>: ${sisya.noHp}
📋 <b>No. Daftar</b>: <code>${sisya.nomorPendaftaran}</code>

📚 <b>Program Ajahan:</b>
${programLines}

💰 <b>Total Punia</b>: Rp ${sisya.totalPunia.toLocaleString('id-ID')}
📅 <b>Waktu</b>: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA
`.trim();
};

/**
 * Format notifikasi bukti punia masuk
 */
const formatNotifikasiBuktiPunia = (sisya) => {
  return `
💳 <b>Bukti Punia Masuk!</b> (Upload Menyusul)

📋 <b>No. Daftar</b>: <code>${sisya.nomorPendaftaran}</code>
👤 <b>Nama</b>: ${sisya.namaLengkap}
💰 <b>Total Punia</b>: Rp ${sisya.totalPunia.toLocaleString('id-ID')}
📅 <b>Tgl Upload</b>: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA

<i>Silakan verifikasi bukti pembayaran di panel admin.</i>
`.trim();
};

/**
 * Format pesan summary statistik
 */
const formatSummaryMessage = (data) => {
  const prodiLines = data.perProgram
    .map(p => `<b>${p.nama}</b>\n♂️ Laki-laki: ${p.lakiLaki}\n♀️ Perempuan: ${p.perempuan}`)
    .join('\n\n');

  return `
📊 <b>Summary Sisya Baru per Program</b>
━━━━━━━━━━━━━━━━━━━━━
${prodiLines}

👥 <b>Total Keseluruhan</b>: ${data.total}
📅 <b>Bulan Ini</b>: ${data.bulanIni}
📆 <b>Hari Ini</b>: ${data.hariIni}

🕐 <i>Data per ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA</i>
`.trim();
};

module.exports = {
  sendMessage,
  formatNotifikasiRegistrasi,
  formatNotifikasiBuktiPunia,
  formatSummaryMessage
};
