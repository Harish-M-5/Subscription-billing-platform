const mongoose = require('mongoose');

const BUSINESS_TYPES = [
  'Gym',
  'Clinic',
  'Coaching Institute',
  'Tuition Center',
  'Salon',
  'Yoga Center',
  'Dance Academy',
  'Music Academy',
  'Sports Academy',
  'Training Center',
  'Other',
];

const businessSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, unique: true, immutable: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: BUSINESS_TYPES, required: true },
    customType: { type: String, trim: true, default: null }, // used when type === 'Other'
    address: { type: String, trim: true, default: '' },
    logoUrl: { type: String, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Business', businessSchema);
module.exports.BUSINESS_TYPES = BUSINESS_TYPES;
