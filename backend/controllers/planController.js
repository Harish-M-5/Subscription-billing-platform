const SubscriptionPlan = require('../models/SubscriptionPlan');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyPlanCreated, notifyPlanUpdated } = require('../utils/notificationEvents');

// GET /api/plans
const listPlans = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;
  const filter = { business: req.tenantBusinessId };
  if (!includeInactive) filter.isActive = true;
  const plans = await SubscriptionPlan.find(filter).sort({ price: 1 });
  res.json({ success: true, plans });
});

// POST /api/plans  (owner only)
const createPlan = asyncHandler(async (req, res) => {
  const { name, description, price, billingCycle, features } = req.body;
  if (!name || price === undefined || !billingCycle) {
    return res.status(400).json({ success: false, message: 'Name, price and billingCycle are required.' });
  }
  const plan = await SubscriptionPlan.create({
    business: req.tenantBusinessId,
    name,
    description,
    price,
    billingCycle,
    features: features || [],
  });

  await notifyPlanCreated({ business: req.tenantBusinessId, actor: req.user._id, plan });

  res.status(201).json({ success: true, plan });
});

// PUT /api/plans/:id  (owner only)
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findOne({ _id: req.params.id, business: req.tenantBusinessId });
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });

  const { name, description, price, billingCycle, features } = req.body;
  if (name) plan.name = name;
  if (description !== undefined) plan.description = description;
  if (price !== undefined) plan.price = price;
  if (billingCycle) plan.billingCycle = billingCycle;
  if (features) plan.features = features;
  await plan.save();

  await notifyPlanUpdated({ business: req.tenantBusinessId, actor: req.user._id, plan });

  res.json({ success: true, plan });
});

// PUT /api/plans/:id/deactivate  (owner only)
const deactivatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findOneAndUpdate(
    { _id: req.params.id, business: req.tenantBusinessId },
    { isActive: false },
    { new: true }
  );
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
  res.json({ success: true, plan });
});

module.exports = { listPlans, createPlan, updatePlan, deactivatePlan };
