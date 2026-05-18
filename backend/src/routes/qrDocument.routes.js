const express = require('express');
const router = express.Router();
const qrDocumentController = require('../controllers/qrDocument.controller');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middlewares/auth.middleware');

// ─── Public Endpoint (Scan QR-Code) ──────────────────────────────────────────
// No auth required for public validation scans from external mobile devices
router.get('/public/:token', qrDocumentController.verifyDocumentPublic);

// ─── Private Admin Endpoints ──────────────────────────────────────────────────
// Protected endpoints for dashboard users
router.use(requireAuth);

// 1. Generate QR Document: STRICTLY SUPER_ADMIN only
router.post('/', requireSuperAdmin, qrDocumentController.createDocument);

// 2. Monitor & View QR Documents: ADMIN & SUPER_ADMIN allowed
router.get('/', requireAdmin, qrDocumentController.getDocuments);

// 3. Edit & Delete: STRICTLY SUPER_ADMIN only
router.put('/:id', requireSuperAdmin, qrDocumentController.updateDocument);
router.delete('/:id', requireSuperAdmin, qrDocumentController.deleteDocument);

module.exports = router;
