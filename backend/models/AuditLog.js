const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. 'payment.record', 'subscription.cancel'
    entityType: { type: String, required: true }, // e.g. 'Customer', 'Payment'
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ business: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
