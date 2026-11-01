const express = require('express');
const router = express.Router();
const { listPlans, createPlan, updatePlan, deactivatePlan } = require('../controllers/planController');
const { protect } = require('../middleware/auth');
const { businessUserOnly } = require('../middleware/roleCheck');
const { requirePermission } = require('../middleware/permissions');

router.use(protect, businessUserOnly);

// View: Owner, Manager only (Manager needs this to pick a plan when creating
// a subscription; Receptionist cannot create subscriptions so has no need to
// see the plan catalog, and cannot edit plans either way).
router.get('/', requirePermission('PLAN_VIEW'), listPlans);
// Create/edit/deactivate: Owner only
router.post('/', requirePermission('PLAN_MANAGE'), createPlan);
router.put('/:id', requirePermission('PLAN_MANAGE'), updatePlan);
router.put('/:id/deactivate', requirePermission('PLAN_MANAGE'), deactivatePlan);

module.exports = router;
