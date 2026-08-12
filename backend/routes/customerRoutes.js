const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  lookupCustomers,
} = require('../controllers/customerController');

// Public, unauthenticated endpoint used by the customer-facing lookup page.
// Declared before requireAuth is applied below, and before /:id so it isn't
// swallowed by it.
router.get('/lookup', lookupCustomers);

// Everything else is admin-only.
router.use(requireAuth);

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;