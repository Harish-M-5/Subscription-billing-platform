const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAction } = require('../utils/audit');
const { notifyPaymentReceived, notifyPaymentFailed } = require('../utils/notificationEvents');

const EPSILON = 0.01; // guards against floating point rounding when comparing money

// POST /api/payments  { customerId, subscriptionId, invoiceId, amount, method, notes, markAsFailed? }
// Supports full AND partial payments against an invoice. Example: a ₹1300
// plan where the customer pays ₹700 leaves the invoice "partial" with a
// ₹600 balance due; paying the remaining ₹600 later (same invoice) settles
// it to "paid". Every payment is its own transaction record, so the
// invoice's full payment history (and the PDF) always reflects reality.
//
// markAsFailed: true logs a failed payment ATTEMPT (e.g. a declined card or a
// bounced UPI request) without touching the invoice balance - it's a record
// of what was attempted, not a successful transaction, and fires the
// "payment failed" notification instead of "payment received".
const recordPayment = asyncHandler(async (req, res) => {
  const { customerId, subscriptionId, invoiceId, amount, method, notes, markAsFailed, failureReason } = req.body;
  if (!customerId || !subscriptionId || amount === undefined || !method) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
  }
  if (!['cash', 'upi', 'card', 'bank_transfer'].includes(method)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method.' });
  }

  const customer = await Customer.findOne({ _id: customerId, business: req.tenantBusinessId });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

  // A failed attempt is recorded as-is and never touches invoice balances.
  if (markAsFailed) {
    const failedPayment = await Payment.create({
      business: req.tenantBusinessId,
      customer: customerId,
      subscription: subscriptionId,
      invoice: invoiceId || null,
      amount: numericAmount,
      method,
      status: 'failed',
      recordedBy: req.user._id,
      notes: notes || failureReason,
    });

    await notifyPaymentFailed({ business: req.tenantBusinessId, customer, amount: numericAmount, method, reason: failureReason });
    await logAction({
      business: req.tenantBusinessId,
      actor: req.user._id,
      action: 'payment.failed',
      entityType: 'Payment',
      entityId: failedPayment._id,
      details: { amount: numericAmount, method },
    });

    return res.status(201).json({ success: true, payment: failedPayment, invoice: null });
  }

  let invoice = invoiceId
    ? await Invoice.findOne({ _id: invoiceId, business: req.tenantBusinessId })
    : await Invoice.findOne({
        subscription: subscriptionId,
        business: req.tenantBusinessId,
        status: { $in: ['pending', 'partial'] },
      }).sort({ issuedAt: -1 });

  if (invoice && numericAmount > invoice.balanceDue + EPSILON) {
    return res.status(400).json({
      success: false,
      message: `Amount exceeds the balance due of ₹${invoice.balanceDue.toLocaleString('en-IN')}.`,
    });
  }

  const payment = await Payment.create({
    business: req.tenantBusinessId,
    customer: customerId,
    subscription: subscriptionId,
    invoice: invoice ? invoice._id : null,
    amount: numericAmount,
    method,
    status: 'paid',
    recordedBy: req.user._id,
    notes,
  });

  if (invoice) {
    invoice.amountPaid = Math.round((invoice.amountPaid + numericAmount) * 100) / 100;
    invoice.balanceDue = Math.max(0, Math.round((invoice.amount - invoice.amountPaid) * 100) / 100);
    invoice.status = invoice.balanceDue <= EPSILON ? 'paid' : 'partial';
    invoice.payment = payment._id;
    // Nothing left to collect - switch off any recurring installment
    // reminder so it doesn't keep firing "payment due" notifications for a
    // balance that's already settled.
    if (invoice.status === 'paid' && invoice.installmentPlan?.enabled) {
      invoice.installmentPlan.enabled = false;
    }
    await invoice.save();
  }

  await notifyPaymentReceived({ business: req.tenantBusinessId, customer, amount: numericAmount, method });

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'payment.record',
    entityType: 'Payment',
    entityId: payment._id,
    details: { amount: numericAmount, method, invoiceStatus: invoice?.status },
  });

  res.status(201).json({ success: true, payment, invoice });
});

// GET /api/payments?status=&method=&customerId=
const listPayments = asyncHandler(async (req, res) => {
  const { status, method, customerId, page = 1, limit = 20 } = req.query;
  const filter = { business: req.tenantBusinessId };
  if (status) filter.status = status;
  if (method) filter.method = method;
  if (customerId) filter.customer = customerId;

  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('customer', 'name customerId')
      .populate('recordedBy', 'fullName role')
      .populate('invoice', 'invoiceNumber status amount amountPaid balanceDue')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    payments,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

module.exports = { recordPayment, listPayments };
