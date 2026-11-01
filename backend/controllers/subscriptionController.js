const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateInvoiceNumber } = require('../utils/idGenerator');
const { logAction } = require('../utils/audit');
const {
  notifySubscriptionActivated,
  notifySubscriptionRenewed,
  notifySubscriptionUpgraded,
  notifyInvoiceGenerated,
} = require('../utils/notificationEvents');

const CYCLE_DAYS = { monthly: 30, quarterly: 91, half_yearly: 182, yearly: 365 };

function computeEndDate(startDate, billingCycle) {
  const end = new Date(startDate);
  end.setDate(end.getDate() + CYCLE_DAYS[billingCycle]);
  return end;
}

async function createInvoiceForSubscription({ business, customer, subscription, plan, actor }) {
  const invoiceNumber = await generateInvoiceNumber();
  const invoice = await Invoice.create({
    invoiceNumber,
    business,
    customer,
    subscription: subscription._id,
    planName: plan.name,
    amount: subscription.priceAtSubscription,
    amountPaid: 0,
    balanceDue: subscription.priceAtSubscription,
    billingCycle: plan.billingCycle,
    status: 'pending',
    generatedBy: actor,
  });
  return invoice;
}

// Recompute a customer's denormalized subscriptionStatus + currentSubscription pointer.
async function syncCustomerStatus(customerId) {
  const latest = await Subscription.findOne({ customer: customerId, status: { $in: ['active', 'expiring_soon'] } }).sort({
    endDate: -1,
  });
  await Customer.findByIdAndUpdate(customerId, {
    currentSubscription: latest ? latest._id : null,
    subscriptionStatus: latest ? latest.status : 'none',
  });
}

// POST /api/subscriptions  { customerId, planId, startDate?, endDate? }
// startDate/endDate are optional - a customer/staff can set their own custom
// join date and end date for the plan; if omitted, they're auto-calculated
// from today + the plan's billing cycle, same as before.
const createSubscription = asyncHandler(async (req, res) => {
  const { customerId, planId, startDate: customStart, endDate: customEnd } = req.body;
  const customer = await Customer.findOne({ _id: customerId, business: req.tenantBusinessId });
  const plan = await SubscriptionPlan.findOne({ _id: planId, business: req.tenantBusinessId, isActive: true });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found or inactive.' });

  let startDate = customStart ? new Date(customStart) : new Date();
  let endDate = customEnd ? new Date(customEnd) : computeEndDate(startDate, plan.billingCycle);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid start or end date.' });
  }
  if (endDate <= startDate) {
    return res.status(400).json({ success: false, message: 'End date must be after the start date.' });
  }

  const subscription = await Subscription.create({
    business: req.tenantBusinessId,
    customer: customer._id,
    plan: plan._id,
    startDate,
    endDate,
    status: 'active',
    priceAtSubscription: plan.price,
    createdBy: req.user._id,
  });

  const invoice = await createInvoiceForSubscription({
    business: req.tenantBusinessId,
    customer: customer._id,
    subscription,
    plan,
    actor: req.user._id,
  });

  await syncCustomerStatus(customer._id);

  await notifySubscriptionActivated({ business: req.tenantBusinessId, customer, plan });
  await notifyInvoiceGenerated({ business: req.tenantBusinessId, customer, invoiceNumber: invoice.invoiceNumber });

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'subscription.create',
    entityType: 'Subscription',
    entityId: subscription._id,
  });

  res.status(201).json({ success: true, subscription, invoice });
});

// POST /api/subscriptions/:id/renew
const renewSubscription = asyncHandler(async (req, res) => {
  const current = await Subscription.findOne({ _id: req.params.id, business: req.tenantBusinessId }).populate('plan');
  if (!current) return res.status(404).json({ success: false, message: 'Subscription not found.' });

  const startDate = new Date();
  const endDate = computeEndDate(startDate, current.plan.billingCycle);

  current.status = 'cancelled'; // superseded by renewal
  await current.save();

  const renewed = await Subscription.create({
    business: req.tenantBusinessId,
    customer: current.customer,
    plan: current.plan._id,
    startDate,
    endDate,
    status: 'active',
    priceAtSubscription: current.plan.price,
    createdBy: req.user._id,
    previousSubscription: current._id,
  });

  const customer = await Customer.findById(current.customer);
  const invoice = await createInvoiceForSubscription({
    business: req.tenantBusinessId,
    customer: current.customer,
    subscription: renewed,
    plan: current.plan,
    actor: req.user._id,
  });

  await syncCustomerStatus(current.customer);

  await notifySubscriptionRenewed({ business: req.tenantBusinessId, customer, plan: current.plan, endDate });
  await notifyInvoiceGenerated({ business: req.tenantBusinessId, customer, invoiceNumber: invoice.invoiceNumber });

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'subscription.renew',
    entityType: 'Subscription',
    entityId: renewed._id,
  });

  res.json({ success: true, subscription: renewed, invoice });
});

// POST /api/subscriptions/:id/upgrade  { newPlanId }
const upgradeSubscription = asyncHandler(async (req, res) => {
  const { newPlanId } = req.body;
  const current = await Subscription.findOne({ _id: req.params.id, business: req.tenantBusinessId });
  const newPlan = await SubscriptionPlan.findOne({ _id: newPlanId, business: req.tenantBusinessId, isActive: true });
  if (!current) return res.status(404).json({ success: false, message: 'Subscription not found.' });
  if (!newPlan) return res.status(404).json({ success: false, message: 'Target plan not found or inactive.' });

  current.status = 'upgraded';
  await current.save();

  const startDate = new Date();
  const endDate = computeEndDate(startDate, newPlan.billingCycle);

  const upgraded = await Subscription.create({
    business: req.tenantBusinessId,
    customer: current.customer,
    plan: newPlan._id,
    startDate,
    endDate,
    status: 'active',
    priceAtSubscription: newPlan.price,
    createdBy: req.user._id,
    previousSubscription: current._id,
  });

  const customer = await Customer.findById(current.customer);
  const invoice = await createInvoiceForSubscription({
    business: req.tenantBusinessId,
    customer: current.customer,
    subscription: upgraded,
    plan: newPlan,
    actor: req.user._id,
  });

  await syncCustomerStatus(current.customer);

  await notifySubscriptionUpgraded({ business: req.tenantBusinessId, customer, plan: newPlan });
  await notifyInvoiceGenerated({ business: req.tenantBusinessId, customer, invoiceNumber: invoice.invoiceNumber });

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'subscription.upgrade',
    entityType: 'Subscription',
    entityId: upgraded._id,
  });

  res.json({ success: true, subscription: upgraded, invoice });
});

// POST /api/subscriptions/:id/cancel  { reason }
const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ _id: req.params.id, business: req.tenantBusinessId });
  if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found.' });

  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  subscription.cancelReason = req.body.reason || null;
  await subscription.save();

  await syncCustomerStatus(subscription.customer);

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'subscription.cancel',
    entityType: 'Subscription',
    entityId: subscription._id,
  });

  res.json({ success: true, subscription });
});

// GET /api/subscriptions?status=&customerId=
const listSubscriptions = asyncHandler(async (req, res) => {
  const { status, customerId, page = 1, limit = 20 } = req.query;
  const filter = { business: req.tenantBusinessId };
  if (status) filter.status = status;
  if (customerId) filter.customer = customerId;

  const skip = (Number(page) - 1) * Number(limit);
  const [subscriptions, total] = await Promise.all([
    Subscription.find(filter)
      .populate('customer', 'name customerId email')
      .populate('plan', 'name price billingCycle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Subscription.countDocuments(filter),
  ]);

  res.json({
    success: true,
    subscriptions,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

module.exports = {
  createSubscription,
  renewSubscription,
  upgradeSubscription,
  cancelSubscription,
  listSubscriptions,
  syncCustomerStatus,
};
