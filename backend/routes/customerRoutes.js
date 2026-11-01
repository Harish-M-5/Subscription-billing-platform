const express = require('express');
const router = express.Router();
const { listCustomers, getCustomer, addCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const { businessUserOnly } = require('../middleware/roleCheck');
const { requirePermission } = require('../middleware/permissions');

router.use(protect, businessUserOnly);

// View + search/filter: Owner, Manager, Receptionist
router.get('/', requirePermission('CUSTOMER_VIEW'), listCustomers);
router.get('/:id', requirePermission('CUSTOMER_VIEW'), getCustomer);
// Add/register: Owner, Manager, Receptionist
router.post('/', requirePermission('CUSTOMER_ADD'), addCustomer);
// Edit: Owner, Manager only (Receptionist can register but not edit)
router.put('/:id', requirePermission('CUSTOMER_EDIT'), updateCustomer);
// Delete: Owner only (Manager and Receptionist are explicitly excluded)
router.delete('/:id', requirePermission('CUSTOMER_DELETE'), deleteCustomer);

module.exports = router;
