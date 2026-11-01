const Invoice = require('../models/Invoice');
const Business = require('../models/Business');
const Payment = require('../models/Payment');
const { asyncHandler } = require('../middleware/errorHandler');
const { renderInvoicePdf } = require('../utils/invoicePdf');

// GET /api/invoices?customerId=&status=
const listInvoices = asyncHandler(async (req, res) => {
  const { customerId, status, page = 1, limit = 20 } = req.query;
  const filter = { business: req.tenantBusinessId };
  if (status) filter.status = status;
  if (customerId) filter.customer = customerId;

  const skip = (Number(page) - 1) * Number(limit);
  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('customer', 'name customerId')
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Invoice.countDocuments(filter),
  ]);

  res.json({
    success: true,
    invoices,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/invoices/:id
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, business: req.tenantBusinessId })
    .populate('customer', 'name customerId email phone address')
    .populate('subscription')
    .populate('payment');
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
  res.json({ success: true, invoice });
});

// GET /api/invoices/:id/download
// Streams a real, professionally formatted PDF (logo, business address,
// invoice/customer/plan details, full payment history, PAID/PARTIAL/UNPAID
// stamp, signature block) rather than raw JSON, so it opens/downloads/prints
// directly in the browser. Reflects partial payments accurately: plan
// amount, amount paid so far, and balance due are always computed fresh
// from the invoice, never assumed to be fully settled.
const downloadInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, business: req.tenantBusinessId })
    .populate('customer', 'name customerId email phone address')
    .populate('subscription');
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

  const [business, payments] = await Promise.all([
    Business.findById(req.tenantBusinessId).populate('owner', 'fullName'),
    Payment.find({ invoice: invoice._id }).sort({ paidAt: 1 }).populate('recordedBy', 'fullName role'),
  ]);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Business record not found.' });
  }

  try {
    renderInvoicePdf({ invoice, business, payments }, res);
  } catch (err) {
    // renderInvoicePdf streams directly to res - if it throws before any
    // bytes went out, we can still reply with a clean error instead of the
    // connection just dying (which used to show up as a generic "download failed").
    console.error('Invoice PDF generation failed:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate the invoice PDF.' });
    } else {
      res.end();
    }
  }
});

// PUT /api/invoices/:id/installment-plan
// { enabled, amount, frequency, nextDueDate } - sets up, updates, or cancels
// (enabled: false) a recurring installment reminder schedule for this
// invoice's remaining balance. amount/frequency/nextDueDate are only
// required when enabling; cancelling just needs { enabled: false }.
const setInstallmentPlan = asyncHandler(async (req, res) => {
  const { enabled, amount, frequency, nextDueDate } = req.body;
  const invoice = await Invoice.findOne({ _id: req.params.id, business: req.tenantBusinessId });
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

  if (invoice.status === 'paid') {
    return res.status(400).json({ success: false, message: 'This invoice is already fully paid - there is no balance to schedule.' });
  }

  if (enabled === false) {
    invoice.installmentPlan = { enabled: false, amount: null, frequency: null, nextDueDate: null };
    await invoice.save();
    return res.json({ success: true, invoice });
  }

  const validFrequencies = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Installment amount must be a positive number.' });
  }
  if (!validFrequencies.includes(frequency)) {
    return res.status(400).json({ success: false, message: 'Invalid frequency. Use monthly, quarterly, half_yearly or yearly.' });
  }
  const dueDate = nextDueDate ? new Date(nextDueDate) : new Date();
  if (Number.isNaN(dueDate.getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid due date.' });
  }

  invoice.installmentPlan = { enabled: true, amount: numericAmount, frequency, nextDueDate: dueDate };
  await invoice.save();

  res.json({ success: true, invoice });
});

module.exports = { listInvoices, getInvoice, downloadInvoice, setInstallmentPlan };
