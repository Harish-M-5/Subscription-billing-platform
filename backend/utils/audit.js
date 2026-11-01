const AuditLog = require('../models/AuditLog');

async function logAction({ business, actor, action, entityType, entityId, details = {} }) {
  try {
    await AuditLog.create({ business, actor, action, entityType, entityId, details });
  } catch (err) {
    // Audit logging must never break the primary request flow.
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAction };
