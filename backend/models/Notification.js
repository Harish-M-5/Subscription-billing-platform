const mongoose = require('mongoose');

// The full catalog of business events the platform raises notifications for.
// Frontend icon/color/label mapping (NOTIFICATION_META) keys off this exact
// list, so add here first when introducing a new event type.
const NOTIFICATION_TYPES = [
  'customer_registered',
  'customer_profile_updated',
  'customer_deleted',
  'subscription_activated',
  'subscription_renewed',
  'subscription_upgraded',
  'subscription_expiring_soon',
  'subscription_expired',
  'payment_received',
  'payment_failed',
  'payment_due',
  'invoice_generated',
  'plan_created',
  'plan_updated',
  'staff_added',
  'staff_deactivated',
];

const notificationSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    // Who this notification is "for" - a customer's own login for
    // customer-facing events, or the staff member who performed a
    // business-internal action (plan/staff changes) with no single customer.
    // The business-wide notification center lists everything by `business`
    // regardless of this field; the customer portal filters strictly by it,
    // so a customer can never see another customer's or the business's
    // internal-only notifications.
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Set whenever the event concerns a specific customer, so the business
    // notification center can show "Customer Name" + "Customer ID" directly.
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    channel: { type: String, enum: ['email', 'sms', 'in_app'], required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    // Short event title, e.g. "New Subscription Created"
    subject: { type: String, default: '' },
    // One-line human description, e.g. "Premium subscription started for Rahul Kumar."
    message: { type: String, required: true },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
    sentAt: { type: Date, default: null },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ business: 1, createdAt: -1 });
notificationSchema.index({ recipientUser: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
