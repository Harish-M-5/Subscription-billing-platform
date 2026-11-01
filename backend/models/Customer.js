const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, immutable: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true, default: '' },
    profilePhotoUrl: { type: String, default: null },
    joinDate: { type: Date, default: Date.now },
    // Denormalized for fast list views; source of truth is Subscription
    currentSubscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'expiring_soon', 'expired', 'cancelled'],
      default: 'none',
    },
    isActive: { type: Boolean, default: true }, // soft delete
  },
  { timestamps: true }
);

customerSchema.index({ business: 1, name: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
