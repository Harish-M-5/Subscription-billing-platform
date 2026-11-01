const express = require('express');
const router = express.Router();
const { getMyBusiness, updateMyBusiness, updateSettings } = require('../controllers/businessController');
const { protect } = require('../middleware/auth');
const { businessUserOnly } = require('../middleware/roleCheck');
const { requirePermission } = require('../middleware/permissions');

router.use(protect, businessUserOnly);

// Every business role can read basic business info (needed for header/sidebar
// branding), but only the Owner can view/change Settings or edit business info.
router.get('/me', getMyBusiness);
router.put('/me', requirePermission('BUSINESS_SETTINGS_MANAGE'), updateMyBusiness);
router.put('/settings', requirePermission('BUSINESS_SETTINGS_MANAGE'), updateSettings);

module.exports = router;
