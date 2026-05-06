const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporan.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// GET /api/laporan/sisya
router.get('/sisya', requireAuth, requireAdmin, laporanController.getLaporanSisya);

// GET /api/laporan/punia/range
router.get('/punia/range', requireAuth, requireAdmin, laporanController.getLaporanPuniaRange);

// GET /api/laporan/punia/bulanan
router.get('/punia/bulanan', requireAuth, requireAdmin, laporanController.getLaporanPuniaBulanan);
 
// GET /api/laporan/punia/dashboard
router.get('/punia/dashboard', requireAuth, requireAdmin, laporanController.getLaporanPuniaDashboard);

// GET /api/laporan/punia/export
router.get('/punia/export', requireAuth, requireAdmin, laporanController.exportPuniaRange);

// GET /api/laporan/absensi
router.get('/absensi', requireAuth, requireAdmin, laporanController.getLaporanAbsensi);

// GET /api/laporan/absensi/export
router.get('/absensi/export', requireAuth, requireAdmin, laporanController.exportLaporanAbsensi);

// GET /api/laporan/export
router.get('/export', requireAuth, requireAdmin, laporanController.exportSisya);

module.exports = router;
