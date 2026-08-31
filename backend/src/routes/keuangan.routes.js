const express = require('express');
const controller = require('../controllers/keuangan.controller');
const upload = require('../middlewares/upload.middleware');
const { requireAuth, requireFinanceAccess, requireTreasurer } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(requireAuth, requireFinanceAccess);

router.get('/dashboard', controller.getDashboard);
router.get('/verification-documents', controller.listVerificationDocuments);
router.get('/kategori', controller.listCategories);
router.get('/akun-kas', controller.listAccounts);
router.post('/kategori', requireTreasurer, controller.saveCategory);
router.patch('/kategori/:id', requireTreasurer, controller.saveCategory);
router.post('/akun-kas', requireTreasurer, controller.saveAccount);
router.patch('/akun-kas/:id', requireTreasurer, controller.saveAccount);

router.get('/rab', controller.listRab);
router.post('/rab', upload.single('dokumen'), controller.createRab);
router.get('/rab/:id/export.xlsx', controller.exportExcel);
router.get('/rab/:id', controller.getRab);
router.patch('/rab/:id', upload.single('dokumen'), controller.updateRab);
router.patch('/rab/:id/metadata', requireTreasurer, controller.updateRabMetadata);
router.post('/rab/:id/submit', controller.submitRab);
router.post('/rab/:id/approve', requireTreasurer, controller.approveRab);
router.post('/rab/:id/reject', requireTreasurer, controller.rejectRab);
router.post('/rab/:id/pencairan', requireTreasurer, upload.single('bukti'), controller.addDisbursement);
router.post('/rab/:id/pengeluaran', upload.single('bukti'), controller.addExpense);
router.post('/rab/:id/pengembalian', requireTreasurer, upload.single('bukti'), controller.addReturn);
router.post('/rab/:id/submit-lpj', controller.submitLpj);
router.post('/rab/:id/request-revision', requireTreasurer, controller.requestRevision);
router.post('/rab/:id/close', requireTreasurer, controller.closeRab);
router.post('/rab/:id/sign-lpj', requireTreasurer, controller.signCompletedLpj);
router.patch('/rab/:id/dokumen', upload.single('bukti'), controller.updateRabEvidence);

router.post('/pencairan/:id/cancel', requireTreasurer, controller.cancelDisbursement);
router.patch('/pencairan/:id/bukti', upload.single('bukti'), controller.updateDisbursementEvidence);
router.patch('/pengeluaran/:id', requireTreasurer, upload.single('bukti'), controller.updateExpense);
router.patch('/pengeluaran/:id/bukti', upload.single('bukti'), controller.updateExpenseEvidence);
router.post('/pengeluaran/:id/verify', requireTreasurer, controller.verifyExpense);
router.post('/pengeluaran/:id/reject', requireTreasurer, controller.rejectExpense);
router.post('/pengeluaran/:id/cancel', requireTreasurer, controller.cancelExpense);
router.post('/pengembalian/:id/cancel', requireTreasurer, controller.cancelReturn);
router.patch('/pengembalian/:id/bukti', upload.single('bukti'), controller.updateReturnEvidence);
router.get('/files/:filename', controller.serveFile);

module.exports = router;
