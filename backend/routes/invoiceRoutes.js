const express = require('express');
const router = express.Router();
const { listInvoices, getInvoice, downloadInvoice, setInstallmentPlan } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { businessUserOnly } = require('../middleware/roleCheck');
const { requirePermission } = require('../middleware/permissions');

router.use(protect, businessUserOnly);

// The full Billing ledger (every invoice across the business): Owner, Manager only.
router.get('/', requirePermission('INVOICE_VIEW_LIST'), listInvoices);
router.get('/:id', requirePermission('INVOICE_VIEW_LIST'), getInvoice);
// Downloading the PDF for a specific invoice: also Receptionist, since they
// record payments and need to hand the customer their receipt immediately.
router.get('/:id/download', requirePermission('INVOICE_DOWNLOAD'), downloadInvoice);
// Setting up a recurring installment reminder: same roles as recording a
// payment (Owner, Manager, Receptionist) - it's the same responsibility.
router.put('/:id/installment-plan', requirePermission('PAYMENT_RECORD'), setInstallmentPlan);

module.exports = router;
