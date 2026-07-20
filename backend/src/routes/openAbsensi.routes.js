const express = require('express');
const router = express.Router();
const openAbsensiController = require('../controllers/openAbsensi.controller');
const upload = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');
const { inputAbsensiSchema } = require('../../../shared/schemas/absensi.schema');

// ─── Public Endpoints (No Auth) ──────────────────────────────────────────────

// Daftar program ajahan
router.get('/program-ajahan', openAbsensiController.getPrograms);

// Verifikasi PIN koordinator
router.post('/verify-pin', openAbsensiController.verifyPin);

// Daftar mata kuliah per program
router.get('/program-ajahan/:programId/mata-kuliah', openAbsensiController.getMataKuliahByProgram);

// Daftar sesi per mata kuliah
router.get('/mata-kuliah/:mkId/sesi', openAbsensiController.getSesiByMataKuliah);

// Detail sesi (daftar sisya untuk input absensi)
router.get('/sesi/:sesiId', openAbsensiController.getSesiDetail);

// Input absensi
router.post('/sesi/:sesiId/input', validate(inputAbsensiSchema), openAbsensiController.inputAbsensi);

// Upload dokumentasi KBM
router.post('/sesi/:sesiId/upload-dokumentasi', upload.fields([
  { name: 'dokSisya', maxCount: 1 },
  { name: 'dokNarawak', maxCount: 1 },
  { name: 'dokPanitia', maxCount: 1 }
]), openAbsensiController.uploadDokumentasi);

// Serve file untuk preview (Public)
router.get('/files/:filename', openAbsensiController.serveFile);

module.exports = router;
