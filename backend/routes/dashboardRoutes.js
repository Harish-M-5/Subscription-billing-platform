const express = require('express');
const router = express.Router();
const { getSummary, getReports } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { businessUserOnly } = require('../middleware/roleCheck');
const { requirePermission } = require('../middleware/permissions');

router.use(protect, businessUserOnly);

router.get('/summary', requirePermission('DASHBOARD_VIEW'), getSummary);
// Advanced reports: Owner, Manager only - explicitly excluded for Receptionist
router.get('/reports', requirePermission('REPORTS_VIEW'), getReports);

module.exports = router;
