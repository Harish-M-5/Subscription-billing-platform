const express = require('express');
const router = express.Router();
const {
  getPortalDashboard,
  getPortalPayments,
  getPortalInvoices,
  getPortalSubscriptions,
  downloadPortalInvoice,
  getPortalNotifications,
  markPortalNotificationRead,
  markAllPortalNotificationsRead,
  deletePortalNotification,
} = require('../controllers/portalController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect, authorize('customer'));

router.get('/dashboard', getPortalDashboard);
router.get('/payments', getPortalPayments);
router.get('/invoices', getPortalInvoices);
router.get('/invoices/:id/download', downloadPortalInvoice);
router.get('/subscriptions', getPortalSubscriptions);
router.get('/notifications', getPortalNotifications);
router.put('/notifications/read-all', markAllPortalNotificationsRead);
router.put('/notifications/:id/read', markPortalNotificationRead);
router.delete('/notifications/:id', deletePortalNotification);

module.exports = router;
