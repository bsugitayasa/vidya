const express = require('express');
const router = express.Router();
const absensiController = require('../controllers/absensi.controller');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');
const { mataKuliahSchema, createSesiSchema, inputAbsensiSchema } = require('../../../shared/schemas/absensi.schema');

// Semua endpoint absensi hanya untuk admin yang sudah login
router.use(requireAuth, requireAdmin);

// ─── Mata Kuliah ─────────────────────────────────────────────────────────────
router.get('/mata-kuliah', absensiController.getMataKuliah);
router.post('/mata-kuliah', validate(mataKuliahSchema), absensiController.createMataKuliah);
router.patch('/mata-kuliah/:id', validate(mataKuliahSchema), absensiController.updateMataKuliah);
router.delete('/mata-kuliah/:id', absensiController.deleteMataKuliah);

// ─── Sesi Absensi ────────────────────────────────────────────────────────────
router.get('/mata-kuliah/:mkId/sesi', absensiController.getSesiList);
router.get('/mata-kuliah/:mkId/rekap', absensiController.getRekapMataKuliah);
router.get('/mata-kuliah/:mkId/export', absensiController.exportAbsensi);
router.post('/sesi', validate(createSesiSchema), absensiController.createSesi);
router.get('/sesi/:sesiId', absensiController.getSesiDetail);
router.post('/sesi/:sesiId/input', validate(inputAbsensiSchema), absensiController.inputAbsensi);
router.patch('/sesi/:sesiId', requireSuperAdmin, absensiController.updateSesi);

// ─── Dokumentasi KBM ─────────────────────────────────────────────────────────
router.post('/sesi/:sesiId/upload-dokumentasi', upload.fields([
  { name: 'dokSisya', maxCount: 1 },
  { name: 'dokNarawak', maxCount: 1 },
  { name: 'dokPanitia', maxCount: 1 }
]), absensiController.uploadDokumentasi);
router.delete('/sesi/:sesiId/dokumentasi/:kategori', requireSuperAdmin, absensiController.deleteDokumentasi);

// ─── Rekap Per Sisya ─────────────────────────────────────────────────────────
router.get('/sisya/:sisyaId', absensiController.getRekapSisya);

module.exports = router;

