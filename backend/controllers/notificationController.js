const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/notifications?unreadOnly=&type=&page=&limit=
// Business users (Owner, Manager, Receptionist) see every notification
// triggered for their business - new/updated customers, subscription
// lifecycle events, payments, invoices, plan and staff changes - regardless
// of which individual user it was originally "for". This is the business
// Notification Center's full history.
const listNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, type, page = 1, limit = 20 } = req.query;
  const filter = { business: req.tenantBusinessId };
  if (unreadOnly === 'true') filter.read = false;
  if (type) filter.type = type;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('recipientUser', 'fullName email role')
      .populate('customer', 'name customerId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ business: req.tenantBusinessId, read: false }),
  ]);

  res.json({
    success: true,
    notifications,
    unreadCount,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, business: req.tenantBusinessId },
    { read: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, notification });
});

// PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { business: req.tenantBusinessId, read: false },
    { read: true, readAt: new Date() }
  );
  res.json({ success: true, message: 'All notifications marked as read.' });
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, business: req.tenantBusinessId });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, message: 'Notification deleted.' });
});

module.exports = { listNotifications, markRead, markAllRead, deleteNotification };
