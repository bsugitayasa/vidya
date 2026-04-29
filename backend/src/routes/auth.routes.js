const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { loginSchema } = require('../../../shared/schemas/user.schema');

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/auth/me
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
