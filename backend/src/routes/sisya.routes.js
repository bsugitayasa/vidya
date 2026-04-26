const express = require('express');
const router = express.Router();
const sisyaController = require('../controllers/sisya.controller');
const pembayaranController = require('../controllers/pembayaran.controller');
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
  { name: 'filePunia', maxCount: 1 },
  { name: 'fileRekomendasi', maxCount: 1 }
]), sisyaController.register);

// GET /api/sisya/files/:filename (Protected - for viewing documents)
router.get('/files/:filename', requireAuth, requireAdmin, sisyaController.serveFile);

// GET /api/sisya/:id
router.get('/:id', requireAuth, requireAdmin, sisyaController.getById);

// POST /api/sisya/:sisyaId/upload-punia (Public - for late payment proof upload)
router.post('/:sisyaId/upload-punia', upload.single('filePunia'), pembayaranController.uploadBuktiBayar);

// POST /api/sisya/lengkapi-berkas (Public - for re-uploading documents)
router.post('/lengkapi-berkas', upload.fields([
  { name: 'fileIdentitas', maxCount: 1 },
  { name: 'fileFoto', maxCount: 1 },
  { name: 'fileRekomendasi', maxCount: 1 }
]), sisyaController.lengkapiBerkas);

// PATCH /api/sisya/:id/status
router.patch('/:id/status', requireAuth, requireAdmin, sisyaController.updateStatus);

module.exports = router;
