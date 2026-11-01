const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['manager', 'receptionist'], required: true },
    profilePhotoUrl: { type: String, default: null },
    // Soft delete: never hard-delete staff — historical invoices/payments reference them.
    isActive: { type: Boolean, default: true },
    deactivatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
