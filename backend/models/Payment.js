const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer'], required: true },
    status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'paid' },
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // staff soft-deleted, not removed
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ business: 1, status: 1, paidAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
