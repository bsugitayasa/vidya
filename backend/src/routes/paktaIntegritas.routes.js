const express = require('express');
const controller = require('../controllers/paktaIntegritas.controller');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middlewares/auth.middleware');
const { paktaLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();

router.get('/public/verify/:code', paktaLimiter, controller.verifyPublicDocument);
router.post('/public/identity', paktaLimiter, controller.verifyIdentityGeneral);
router.post('/public/sign', paktaLimiter, controller.signPakta);
router.get('/public/:token', paktaLimiter, controller.getPublicPakta);
router.post('/public/:token/identity', paktaLimiter, controller.verifyIdentity);
router.post('/public/:token/sign', paktaLimiter, controller.signPakta);

router.use(requireAuth, requireAdmin);
router.get('/templates', controller.getTemplates);
router.get('/stats', controller.getStats);
router.get('/assignments', controller.getAssignments);
router.get('/assignments/:id', controller.getAdminDocument);
router.post('/templates', requireSuperAdmin, controller.createTemplate);
router.put('/templates/:id', requireSuperAdmin, controller.updateTemplate);
router.post('/templates/:id/publish', requireSuperAdmin, controller.publishTemplate);
router.post('/assignments/generate', requireSuperAdmin, controller.generateAssignments);
router.post('/assignments/:id/regenerate', requireSuperAdmin, controller.regenerateAssignment);
router.post('/assignments/:id/revoke', requireSuperAdmin, controller.revokeAssignment);

module.exports = router;
