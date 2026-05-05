const express = require('express');
const router = express.Router();
const kelulusanController = require('../controllers/kelulusan.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// Semua rute ini hanya bisa diakses admin
router.use(requireAuth, requireAdmin);

router.get('/eligibility', kelulusanController.getEligibility);
router.patch('/eligibility/:sisyaId', kelulusanController.updateEligibility);
router.get('/absensi', kelulusanController.getHadirKelulusan);
router.post('/absensi/:sisyaId', kelulusanController.inputHadirKelulusan);
router.get('/presentasi', kelulusanController.getPresentasiData);

module.exports = router;
