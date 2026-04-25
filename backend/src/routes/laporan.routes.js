const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporan.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// GET /api/laporan/sisya
router.get('/sisya', requireAuth, requireAdmin, laporanController.getLaporanSisya);

// GET /api/laporan/export
router.get('/export', requireAuth, requireAdmin, laporanController.getLaporanSisya);

module.exports = router;
