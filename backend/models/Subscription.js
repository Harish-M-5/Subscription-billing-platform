const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'expiring_soon', 'expired', 'cancelled', 'upgraded'],
      default: 'active',
    },
    priceAtSubscription: { type: Number, required: true }, // snapshot, in case plan price changes later
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Links a chain of renewals/upgrades for history
    previousSubscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },
  },
  { timestamps: true }
);

subscriptionSchema.index({ business: 1, status: 1 });
subscriptionSchema.index({ business: 1, endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
