const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, deleteAccount } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// Every role (owner, manager, receptionist, customer) can view/edit their own
// profile and change their own password - this is intentionally the one set
// of routes that isn't gated by businessUserOnly, since customers use it too.
router.use(protect, requirePermission('PROFILE_VIEW_EDIT'));

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.delete('/', deleteAccount);

module.exports = router;
