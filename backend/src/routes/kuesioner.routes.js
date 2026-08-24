const express = require('express');
const controller = require('../controllers/kuesioner.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get('/', controller.getAdminSessions);
router.get('/laporan/program', controller.getProgramReport);
router.get('/sesi/:id', controller.getSessionDetail);
router.post('/sesi/:id/analisis-ai', controller.analyzeSession);

module.exports = router;
