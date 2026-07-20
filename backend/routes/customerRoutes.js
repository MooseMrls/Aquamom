const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  lookupCustomers,
} = require('../controllers/customerController');

// NOTE: /lookup must be declared before /:id so it is not swallowed by it.
router.get('/lookup', lookupCustomers);

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
