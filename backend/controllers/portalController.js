const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const Business = require('../models/Business');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const { renderInvoicePdf } = require('../utils/invoicePdf');

// All routes here are scoped to req.user.customerProfile - a customer can
// only ever see their own data, never another customer's or the business's.

// GET /api/portal/dashboard
const getPortalDashboard = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.user.customerProfile)
    .populate('business', 'name businessId type customType logoUrl address')
    .populate({ path: 'currentSubscription', populate: { path: 'plan' } });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer profile not found.' });

  const [payments, invoices] = await Promise.all([
    Payment.find({ customer: customer._id }).sort({ paidAt: -1 }).limit(10),
    Invoice.find({ customer: customer._id }).sort({ issuedAt: -1 }).limit(10),
  ]);

  res.json({ success: true, customer, payments, invoices });
});

// GET /api/portal/payments
const getPortalPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ customer: req.user.customerProfile }).sort({ paidAt: -1 });
  res.json({ success: true, payments });
});

// GET /api/portal/invoices
const getPortalInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ customer: req.user.customerProfile }).sort({ issuedAt: -1 });
  res.json({ success: true, invoices });
});

// GET /api/portal/subscriptions
const getPortalSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ customer: req.user.customerProfile })
    .populate('plan')
    .sort({ createdAt: -1 });
  res.json({ success: true, subscriptions });
});

// GET /api/portal/invoices/:id/download
// Same PDF renderer as the business side, scoped so a customer can only
// ever download an invoice that belongs to their own customer record.
const downloadPortalInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, customer: req.user.customerProfile })
    .populate('customer', 'name customerId email phone address')
    .populate('subscription');
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

  const [business, payments] = await Promise.all([
    Business.findById(invoice.business).populate('owner', 'fullName'),
    Payment.find({ invoice: invoice._id }).sort({ paidAt: 1 }).populate('recordedBy', 'fullName role'),
  ]);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Business record not found.' });
  }

  try {
    renderInvoicePdf({ invoice, business, payments }, res);
  } catch (err) {
    console.error('Invoice PDF generation failed:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate the invoice PDF.' });
    } else {
      res.end();
    }
  }
});

// GET /api/portal/notifications?unreadOnly=
// Every payment confirmation, invoice, subscription update and renewal
// reminder addressed to this customer's own login - scoped by
// recipientUser so it can never show another customer's activity.
const getPortalNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, page = 1, limit = 20 } = req.query;
  const filter = { recipientUser: req.user._id };
  if (unreadOnly === 'true') filter.read = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientUser: req.user._id, read: false }),
  ]);

  res.json({
    success: true,
    notifications,
    unreadCount,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

const markPortalNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientUser: req.user._id },
    { read: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, notification });
});

const markAllPortalNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipientUser: req.user._id, read: false }, { read: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

// DELETE /api/portal/notifications/:id
const deletePortalNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipientUser: req.user._id });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, message: 'Notification deleted.' });
});

module.exports = {
  getPortalDashboard,
  getPortalPayments,
  getPortalInvoices,
  getPortalSubscriptions,
  downloadPortalInvoice,
  getPortalNotifications,
  markPortalNotificationRead,
  markAllPortalNotificationsRead,
  deletePortalNotification,
};
