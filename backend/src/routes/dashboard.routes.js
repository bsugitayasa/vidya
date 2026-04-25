const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

// GET /api/dashboard/stats
router.get('/stats', requireAuth, requireAdmin, dashboardController.getStats);

module.exports = router;
