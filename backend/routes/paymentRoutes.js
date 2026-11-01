const express = require('express');
const router = express.Router();
const { recordPayment, listPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { businessUserOnly } = require('../middleware/roleCheck');
const { requirePermission } = require('../middleware/permissions');

router.use(protect, businessUserOnly);

router.get('/', requirePermission('PAYMENT_VIEW'), listPayments);
router.post('/', requirePermission('PAYMENT_RECORD'), recordPayment);

module.exports = router;
