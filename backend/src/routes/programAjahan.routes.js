const express = require('express');
const router = express.Router();
const programAjahanController = require('../controllers/programAjahan.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// GET /api/program-ajahan
router.get('/', programAjahanController.getAll);

// PATCH /api/program-ajahan/:id
router.patch('/:id', requireAuth, requireAdmin, programAjahanController.updateProgram);

// PATCH /api/program-ajahan/:id/tarif (kept for backward compatibility if needed, but redirects to updateProgram)
router.patch('/:id/tarif', requireAuth, requireAdmin, programAjahanController.updateProgram);

module.exports = router;
