const express = require('express');
const router = express.Router();
const konfigurasiController = require('../controllers/konfigurasi.controller');
const upload = require('../middlewares/upload.middleware');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// Public route to get config
router.get('/', konfigurasiController.getAll);

// Protected admin route to update config
router.patch('/', requireAuth, requireAdmin, konfigurasiController.update);
router.post('/upload-musik', requireAuth, requireAdmin, upload.single('musik'), konfigurasiController.uploadMusik);

module.exports = router;
