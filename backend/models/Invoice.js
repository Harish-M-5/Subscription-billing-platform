const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, immutable: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    // Most recent payment applied to this invoice - convenience pointer only.
    // The full transaction history (for partial payments) lives in Payment
    // documents queried by `invoice`, not here.
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    planName: { type: String, required: true },
    amount: { type: Number, required: true }, // total amount owed for this billing cycle
    amountPaid: { type: Number, required: true, default: 0 },
    balanceDue: { type: Number, required: true, default: function () { return this.amount; } },
    billingCycle: { type: String, required: true },
    // pending: nothing paid yet. partial: some but not all paid. paid: fully settled.
    status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
    issuedAt: { type: Date, default: Date.now },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Optional installment/EMI-style schedule for customers who pay their
    // balance in recurring chunks (e.g. "₹100/month toward a ₹500 plan")
    // instead of one lump sum. When enabled, a scheduled sweep
    // (jobs/installmentDueJob.js) fires a "payment due today" notification
    // to both the business and the customer whenever nextDueDate arrives,
    // then advances nextDueDate by `frequency` - same recurrence pattern as
    // the subscription's own billing cycle (monthly/quarterly/half_yearly/yearly).
    installmentPlan: {
      enabled: { type: Boolean, default: false },
      amount: { type: Number, default: null }, // expected amount per installment
      frequency: { type: String, enum: ['monthly', 'quarterly', 'half_yearly', 'yearly', null], default: null },
      nextDueDate: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ business: 1, issuedAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
