const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
