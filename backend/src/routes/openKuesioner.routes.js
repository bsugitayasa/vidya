const express = require('express');
const controller = require('../controllers/kuesioner.controller');
const validate = require('../middlewares/validate.middleware');
const { questionnaireLimiter } = require('../middlewares/rateLimit.middleware');
const { submitKuesionerSchema } = require('../../../shared/schemas/kuesioner.schema');

const router = express.Router();

router.get('/sesi-hari-ini', controller.getTodaySessions);
router.get('/sesi/:token', controller.getPublicSession);
router.post('/jawaban', questionnaireLimiter, validate(submitKuesionerSchema), controller.submitAnswer);

module.exports = router;
