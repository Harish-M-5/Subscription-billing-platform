const express = require('express');
const router = express.Router();
const { listNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { businessUserOnly } = require('../middleware/roleCheck');
const { requirePermission } = require('../middleware/permissions');

router.use(protect, businessUserOnly, requirePermission('NOTIFICATIONS_VIEW'));

router.get('/', listNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
