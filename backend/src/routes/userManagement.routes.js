const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagement.controller');
const { requireAuth, requireSuperAdmin } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createUserSchema } = require('../../../shared/schemas/user.schema');

// All routes strictly SUPER_ADMIN only
router.use(requireAuth);
router.use(requireSuperAdmin);

// CRUD endpoints
router.get('/', userManagementController.getUsers);
router.post('/', validate(createUserSchema), userManagementController.createUser);
router.delete('/:id', userManagementController.deleteUser);
router.patch('/:id/reset-password', userManagementController.resetPassword);

module.exports = router;
