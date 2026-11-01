const Notification = require('../models/Notification');
const { getIO, businessRoom, userRoom } = require('./socket');

/**
 * Creates a Notification record and pushes it in real time over Socket.io to
 * both the business's shared room (the business Notification Center, which
 * shows every event regardless of who it's "for") and the specific
 * recipient's personal room (which is what the customer portal - or a
 * future per-staff-member inbox - listens on). REST endpoints remain the
 * source of truth for history/pagination; the socket push is purely for
 * "update instantly without a refresh."
 *
 * type must be one of Notification's NOTIFICATION_TYPES.
 * customer is optional - set it whenever the event concerns a specific
 * customer, so the notification can display their name/ID directly.
 */
async function notify({
  business,
  recipientUser,
  customer = null,
  channel = 'in_app',
  type,
  subject = '',
  message,
  meta = {},
}) {
  const record = await Notification.create({
    business,
    recipientUser,
    customer,
    channel,
    type,
    subject,
    message,
    status: 'sent',
    sentAt: new Date(),
    meta,
  });

  const populated = await record.populate('customer', 'name customerId');

  const io = getIO();
  if (io) {
    const payload = populated.toObject();
    io.to(businessRoom(business.toString())).emit('notification:new', payload);
    io.to(userRoom(recipientUser.toString())).emit('notification:new', payload);
  }

  return record;
}

module.exports = { notify };
