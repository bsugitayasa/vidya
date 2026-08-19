const express = require('express');
const router = express.Router();
const sisyaController = require('../controllers/sisya.controller');
const pembayaranController = require('../controllers/pembayaran.controller');
const upload = require('../middlewares/upload.middleware');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { sisyaRegistrationSchema, sisyaUpdateSchema } = require('../../../shared/schemas/sisya.schema');

const { registrationLimiter, statusCheckLimiter } = require('../middlewares/rateLimit.middleware');

// GET /api/sisya
router.get('/', requireAuth, requireAdmin, sisyaController.getAll);

// GET /api/sisya/cari/file (Public - preview document by registration number)
router.get('/cari/file', statusCheckLimiter, sisyaController.servePublicRegistrationFile);

// GET /api/sisya/cari (Public - for checking status)
router.get('/cari', statusCheckLimiter, sisyaController.findByNomor);

// POST /api/sisya/check-duplicate (Public - for checking if already registered)
router.post('/check-duplicate', statusCheckLimiter, sisyaController.checkDuplicate);

// POST /api/sisya/register
router.post('/register', registrationLimiter, upload.fields([
  { name: 'fileIdentitas', maxCount: 1 },
  { name: 'fileFoto', maxCount: 1 },
  { name: 'filePunia', maxCount: 1 },
  { name: 'fileRekomendasi', maxCount: 1 }
]), validate(sisyaRegistrationSchema), sisyaController.register);

// GET /api/sisya/files/:filename (Protected - for viewing documents)
router.get('/files/:filename', requireAuth, requireAdmin, sisyaController.serveFile);

// GET /api/sisya/locations/suggestions
router.get('/locations/suggestions', requireAuth, requireAdmin, sisyaController.getLocations);

// GET /api/sisya/export/absensi (All active Sisya for attendance PDF)
router.get('/export/absensi', requireAuth, requireAdmin, sisyaController.getAttendanceExport);

// GET /api/sisya/:id
router.get('/:id', requireAuth, requireAdmin, sisyaController.getById);

// PUT /api/sisya/:id
router.put('/:id', requireAuth, requireSuperAdmin, validate(sisyaUpdateSchema), sisyaController.updateSisya);

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

// PATCH /api/sisya/program/:spId (Update nomorRegistrasi for a SisyaProgram)
router.patch('/program/:spId', requireAuth, requireAdmin, sisyaController.updateProgramRegistrasi);

// PATCH /api/sisya/:id/programs (Update program ajahan enrollment - SUPER_ADMIN only)
router.patch('/:id/programs', requireAuth, requireSuperAdmin, sisyaController.updateProgramsSisya);

// POST /api/sisya/:id/link-partner (Link two Sisya as partners - SUPER_ADMIN only)
router.post('/:id/link-partner', requireAuth, requireAdmin, sisyaController.linkPartner);

// DELETE /api/sisya/:id/soft-delete (Soft delete by changing status to TIDAK_AKTIF)
router.delete('/:id/soft-delete', requireAuth, requireSuperAdmin, sisyaController.softDelete);

module.exports = router;
