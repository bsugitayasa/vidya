const express = require('express');
const router = express.Router();
const programAjahanController = require('../controllers/programAjahan.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// GET /api/program-ajahan
router.get('/', programAjahanController.getAll);

// PATCH /api/program-ajahan/:id/tarif
router.patch('/:id/tarif', requireAuth, requireAdmin, programAjahanController.updateTarif);

module.exports = router;
