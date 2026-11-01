const express = require('express');
const router = express.Router();
const {
  createSubscription,
  renewSubscription,
  upgradeSubscription,
  cancelSubscription,
  listSubscriptions,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');
const { businessUserOnly } = require('../middleware/roleCheck');
const { requirePermission } = require('../middleware/permissions');

router.use(protect, businessUserOnly);

router.get('/', requirePermission('SUBSCRIPTION_VIEW'), listSubscriptions);
// Create: Owner, Manager only - Receptionist may only renew an existing subscription
router.post('/', requirePermission('SUBSCRIPTION_CREATE'), createSubscription);
// Renew: Owner, Manager, Receptionist
router.post('/:id/renew', requirePermission('SUBSCRIPTION_RENEW'), renewSubscription);
// Upgrade/Cancel: Owner, Manager only - explicitly excluded for Receptionist
router.post('/:id/upgrade', requirePermission('SUBSCRIPTION_UPGRADE'), upgradeSubscription);
router.post('/:id/cancel', requirePermission('SUBSCRIPTION_CANCEL'), cancelSubscription);

module.exports = router;
