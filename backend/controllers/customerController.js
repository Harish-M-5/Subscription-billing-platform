const Customer = require('../models/Customer');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAction } = require('../utils/audit');
const {
  notifyCustomerRegistered,
  notifyCustomerProfileUpdated,
  notifyCustomerDeleted,
} = require('../utils/notificationEvents');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-()\s]{7,20}$/;

function validateCustomerInput({ name, email, phone }, { requireEmail = false } = {}) {
  const errors = [];
  if (name !== undefined && !String(name).trim()) errors.push('Name cannot be empty.');
  if (requireEmail && (!email || !EMAIL_RE.test(String(email).trim()))) errors.push('A valid email is required.');
  if (email !== undefined && email !== '' && !EMAIL_RE.test(String(email).trim())) errors.push('Email format is invalid.');
  if (phone !== undefined && phone !== '' && !PHONE_RE.test(String(phone).trim())) errors.push('Phone number format is invalid.');
  return errors;
}

// GET /api/customers?search=&status=&page=&limit=  (owner/manager/receptionist)
const listCustomers = asyncHandler(async (req, res) => {
  const { search = '', status, page = 1, limit = 20 } = req.query;
  const filter = { business: req.tenantBusinessId, isActive: true };
  if (status) filter.subscriptionStatus = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { customerId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .populate({ path: 'currentSubscription', populate: { path: 'plan', select: 'name price billingCycle' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Customer.countDocuments(filter),
  ]);

  // Attach each customer's outstanding invoice (if any) in one extra query,
  // so the list can show payment status (paid/partial/pending) without N+1 lookups.
  const subIds = customers.map((c) => c.currentSubscription?._id).filter(Boolean);
  const openInvoices = subIds.length
    ? await Invoice.find({ subscription: { $in: subIds }, status: { $in: ['pending', 'partial'] } })
        .select('subscription amount amountPaid balanceDue status invoiceNumber')
    : [];
  const invoiceBySubId = new Map(openInvoices.map((inv) => [inv.subscription.toString(), inv]));
  const customersWithInvoice = customers.map((c) => ({
    ...c.toObject(),
    currentInvoice: c.currentSubscription ? invoiceBySubId.get(c.currentSubscription._id.toString()) || null : null,
  }));

  res.json({
    success: true,
    customers: customersWithInvoice,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/customers/:id
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, business: req.tenantBusinessId }).populate({
    path: 'currentSubscription',
    populate: { path: 'plan' },
  });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

  const subscriptionHistory = await Subscription.find({ customer: customer._id })
    .populate('plan', 'name price billingCycle')
    .sort({ createdAt: -1 });

  // The invoice tied to the customer's currently active subscription, if it
  // still has a balance - this is what the "Record Payment" flow bills
  // against, so the modal can default to (and cap at) the real balance due.
  const currentInvoice = customer.currentSubscription
    ? await Invoice.findOne({ subscription: customer.currentSubscription._id, status: { $in: ['pending', 'partial'] } })
    : null;

  // Attach each historical subscription's invoice status too, so the
  // history table can show paid/partial/pending per past billing cycle.
  const subIds = subscriptionHistory.map((s) => s._id);
  const invoices = subIds.length
    ? await Invoice.find({ subscription: { $in: subIds } }).select('subscription status amount amountPaid balanceDue invoiceNumber')
    : [];
  const invoiceBySubId = new Map(invoices.map((inv) => [inv.subscription.toString(), inv]));
  const historyWithInvoices = subscriptionHistory.map((s) => ({
    ...s.toObject(),
    invoice: invoiceBySubId.get(s._id.toString()) || null,
  }));

  res.json({ success: true, customer, subscriptionHistory: historyWithInvoices, currentInvoice });
});

// POST /api/customers  (owner/manager/receptionist) - staff adding a walk-in customer.
// Creates a login-capable User with a temp password so the customer can self-register later
// or staff can hand them credentials directly.
const addCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  const validationErrors = validateCustomerInput({ name, email, phone }, { requireEmail: true });
  if (validationErrors.length) {
    return res.status(400).json({ success: false, message: validationErrors.join(' ') });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const { generateCustomerId } = require('../utils/idGenerator');
  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    fullName: name,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: 'customer',
    business: req.tenantBusinessId,
  });

  const customerId = await generateCustomerId();
  const customer = await Customer.create({
    customerId,
    business: req.tenantBusinessId,
    user: user._id,
    name,
    email: email.toLowerCase(),
    phone,
    address,
  });
  user.customerProfile = customer._id;
  await user.save();

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'customer.add',
    entityType: 'Customer',
    entityId: customer._id,
  });
  await notifyCustomerRegistered({ business: req.tenantBusinessId, customer });

  res.status(201).json({ success: true, customer });
});

// PUT /api/customers/:id  (owner/manager/receptionist)
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, business: req.tenantBusinessId, isActive: true });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

  const { name, phone, address, profilePhotoUrl } = req.body;
  const validationErrors = validateCustomerInput({ name, phone });
  if (validationErrors.length) {
    return res.status(400).json({ success: false, message: validationErrors.join(' ') });
  }

  if (name) customer.name = name.trim();
  if (phone !== undefined) customer.phone = phone.trim();
  if (address !== undefined) customer.address = address;
  if (profilePhotoUrl !== undefined) customer.profilePhotoUrl = profilePhotoUrl;
  await customer.save();

  // Keep the linked login account's display name/phone in sync.
  await User.findByIdAndUpdate(customer.user, {
    ...(name && { fullName: name.trim() }),
    ...(phone !== undefined && { phone: phone.trim() }),
  });

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'customer.update',
    entityType: 'Customer',
    entityId: customer._id,
  });
  await notifyCustomerProfileUpdated({ business: req.tenantBusinessId, customer, actor: req.user._id });

  res.json({ success: true, customer });
});

// DELETE /api/customers/:id  (owner/manager only)
// Soft delete: preserves the customer's Subscription/Payment/Invoice history
// (which the business still needs for its own records) while removing them
// from active lists and revoking their login, mirroring the staff soft-delete
// rule. The customerId is never reused per spec, which soft delete guarantees.
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, business: req.tenantBusinessId, isActive: true });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

  const activeSub = await Subscription.findOne({ customer: customer._id, status: { $in: ['active', 'expiring_soon'] } });
  if (activeSub) {
    return res.status(409).json({
      success: false,
      message: 'This customer has an active subscription. Cancel it before deleting the customer.',
    });
  }

  customer.isActive = false;
  await customer.save();
  await User.findByIdAndUpdate(customer.user, { isActive: false, deletedAt: new Date() });

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'customer.delete',
    entityType: 'Customer',
    entityId: customer._id,
  });
  await notifyCustomerDeleted({ business: req.tenantBusinessId, actor: req.user._id, customer });

  res.json({ success: true, message: 'Customer deleted.' });
});

module.exports = { listCustomers, getCustomer, addCustomer, updateCustomer, deleteCustomer };
