const rateLimit = require('express-rate-limit');

// Rate limiter untuk pendaftaran (lebih ketat)
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 30, // Maksimal 30 pendaftaran per IP per jam (lebih longgar untuk trafik tinggi)
  message: {
    success: false,
    message: 'Terlalu banyak upaya pendaftaran dari IP ini. Silakan coba lagi setelah satu jam.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter untuk cek status (lebih longgar)
const statusCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 pengecekan per IP per 15 menit
  message: {
    success: false,
    message: 'Terlalu banyak upaya pengecekan status. Silakan coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter untuk login (sangat ketat untuk mencegah brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Maksimal 10 upaya login per IP per 15 menit
  message: {
    success: false,
    message: 'Terlalu banyak upaya login. Silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  registrationLimiter,
  statusCheckLimiter,
  authLimiter
};
