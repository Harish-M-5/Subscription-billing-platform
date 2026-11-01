const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// A single users collection backs all 4 roles. Business users (owner/manager/
// receptionist) are scoped to one business via `business`. Customers are
// scoped to one business via `customer` -> Customer.business.
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['owner', 'manager', 'receptionist', 'customer'],
      required: true,
    },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: null },
    // Only set for role === 'customer'
    customerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    // Only set for role in [manager, receptionist]
    staffProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    profilePhotoUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true }, // soft-delete flag
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

userSchema.index({ business: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
