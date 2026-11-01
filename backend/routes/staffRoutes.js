const express = require('express');
const router = express.Router();
const { listStaff, addStaff, updateStaff, deactivateStaff } = require('../controllers/staffController');
const { protect } = require('../middleware/auth');
const { businessUserOnly } = require('../middleware/roleCheck');
const { requirePermission } = require('../middleware/permissions');

router.use(protect, businessUserOnly);

router.get('/', requirePermission('STAFF_VIEW'), listStaff);
router.post('/', requirePermission('STAFF_MANAGE'), addStaff);
router.put('/:id', requirePermission('STAFF_MANAGE'), updateStaff);
router.delete('/:id', requirePermission('STAFF_MANAGE'), deactivateStaff); // soft delete only

module.exports = router;
