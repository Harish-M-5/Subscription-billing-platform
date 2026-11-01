const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. Basic, Premium, Gold, Platinum
    description: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'],
      required: true,
    },
    features: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true }, // "deactivate" instead of delete
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ business: 1, name: 1 }, { unique: true });

const CYCLE_DAYS = { monthly: 30, quarterly: 91, half_yearly: 182, yearly: 365 };
subscriptionPlanSchema.statics.CYCLE_DAYS = CYCLE_DAYS;

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
