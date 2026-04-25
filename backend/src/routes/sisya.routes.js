const express = require('express');
const router = express.Router();
const sisyaController = require('../controllers/sisya.controller');
const upload = require('../middlewares/upload.middleware');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// GET /api/sisya
router.get('/', requireAuth, requireAdmin, sisyaController.getAll);

// GET /api/sisya/cari (Public - for checking status)
router.get('/cari', sisyaController.findByNomor);

// POST /api/sisya/register
router.post('/register', upload.fields([
  { name: 'fileIdentitas', maxCount: 1 },
  { name: 'fileFoto', maxCount: 1 },
  { name: 'filePunia', maxCount: 1 }
]), sisyaController.register);

// GET /api/sisya/:id
router.get('/:id', requireAuth, requireAdmin, sisyaController.getById);

// POST /api/sisya/:id/upload-punia (Public - for late payment proof upload)
router.post('/:id/upload-punia', upload.single('filePunia'), sisyaController.uploadPunia);

// PATCH /api/sisya/:id/status
router.patch('/:id/status', requireAuth, requireAdmin, sisyaController.updateStatus);

module.exports = router;
