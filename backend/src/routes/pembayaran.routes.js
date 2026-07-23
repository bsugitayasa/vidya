const express = require('express');
const router = express.Router();
const pembayaranController = require('../controllers/pembayaran.controller');
const upload = require('../middlewares/upload.middleware');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middlewares/auth.middleware');

// Public/Sisya upload cicilan
router.post('/upload/:sisyaId', upload.single('filePunia'), pembayaranController.uploadBuktiBayar);

// Admin (Super Admin) upload bukti bayar atas nama sisya
router.post('/admin-upload/:sisyaId', requireAuth, requireSuperAdmin, upload.single('filePunia'), pembayaranController.uploadBuktiBayar);

// Admin verifikasi
router.patch('/:id/verifikasi', requireAuth, requireAdmin, pembayaranController.verifikasiPembayaran);

// Admin hapus (jika belum diverifikasi)
router.delete('/:id', requireAuth, requireAdmin, pembayaranController.deletePembayaran);

router.patch('/:id/edit', requireAuth, requireSuperAdmin, pembayaranController.editPembayaran);
module.exports = router;
