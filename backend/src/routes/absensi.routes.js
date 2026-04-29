const express = require('express');
const router = express.Router();
const absensiController = require('../controllers/absensi.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');
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

// ─── Rekap Per Sisya ─────────────────────────────────────────────────────────
router.get('/sisya/:sisyaId', absensiController.getRekapSisya);

module.exports = router;
