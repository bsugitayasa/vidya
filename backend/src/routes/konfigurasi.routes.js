const express = require('express');
const router = express.Router();
const konfigurasiController = require('../controllers/konfigurasi.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// Public route to get config
router.get('/', konfigurasiController.getAll);

// Protected admin route to update config
router.patch('/', requireAuth, requireAdmin, konfigurasiController.update);

module.exports = router;
