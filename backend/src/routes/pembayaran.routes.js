const express = require('express');
const router = express.Router();
const pembayaranController = require('../controllers/pembayaran.controller');
const upload = require('../middlewares/upload.middleware');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// Public/Sisya upload cicilan
router.post('/upload/:sisyaId', upload.single('filePunia'), pembayaranController.uploadBuktiBayar);

// Admin verifikasi
router.patch('/:id/verifikasi', requireAuth, requireAdmin, pembayaranController.verifikasiPembayaran);

// Admin hapus (jika belum diverifikasi)
router.delete('/:id', requireAuth, requireAdmin, pembayaranController.deletePembayaran);

module.exports = router;
