const express = require('express');
const router = express.Router();
const sisyaController = require('../controllers/sisya.controller');
const pembayaranController = require('../controllers/pembayaran.controller');
const upload = require('../middlewares/upload.middleware');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { sisyaRegistrationSchema, sisyaUpdateSchema } = require('../../../shared/schemas/sisya.schema');

const { registrationLimiter, statusCheckLimiter } = require('../middlewares/rateLimit.middleware');

// GET /api/sisya
router.get('/', requireAuth, requireAdmin, sisyaController.getAll);

// GET /api/sisya/cari (Public - for checking status)
router.get('/cari', statusCheckLimiter, sisyaController.findByNomor);

// POST /api/sisya/register
router.post('/register', registrationLimiter, upload.fields([
  { name: 'fileIdentitas', maxCount: 1 },
  { name: 'fileFoto', maxCount: 1 },
  { name: 'filePunia', maxCount: 1 },
  { name: 'fileRekomendasi', maxCount: 1 }
]), validate(sisyaRegistrationSchema), sisyaController.register);

// GET /api/sisya/files/:filename (Protected - for viewing documents)
router.get('/files/:filename', requireAuth, requireAdmin, sisyaController.serveFile);

// GET /api/sisya/:id
router.get('/:id', requireAuth, requireAdmin, sisyaController.getById);

// PUT /api/sisya/:id
router.put('/:id', requireAuth, requireAdmin, validate(sisyaUpdateSchema), sisyaController.updateSisya);

// POST /api/sisya/:sisyaId/upload-punia (Public - for late payment proof upload)
router.post('/:sisyaId/upload-punia', statusCheckLimiter, upload.single('filePunia'), pembayaranController.uploadBuktiBayar);

// POST /api/sisya/lengkapi-berkas (Public - for re-uploading documents)
router.post('/lengkapi-berkas', statusCheckLimiter, upload.fields([
  { name: 'fileIdentitas', maxCount: 1 },
  { name: 'fileFoto', maxCount: 1 },
  { name: 'fileRekomendasi', maxCount: 1 }
]), sisyaController.lengkapiBerkas);

// PATCH /api/sisya/:id/status (Payment status)
router.patch('/:id/status', requireAuth, requireAdmin, sisyaController.updateStatus);

// PATCH /api/sisya/:id/academic-status (Academic status: AKTIF, MEDIKSA, etc)
router.patch('/:id/academic-status', requireAuth, requireAdmin, sisyaController.updateAcademicStatus);

module.exports = router;
