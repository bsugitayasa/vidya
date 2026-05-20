const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templatePenandatangan.controller');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(requireAuth);

// GET: ADMIN & SUPER_ADMIN can view templates (for dropdown usage)
router.get('/', requireAdmin, templateController.getAll);

// CUD: Only SUPER_ADMIN can manage templates
router.post('/', requireSuperAdmin, templateController.create);
router.put('/:id', requireSuperAdmin, templateController.update);
router.delete('/:id', requireSuperAdmin, templateController.remove);

module.exports = router;
