const express = require('express');
const router = express.Router();
const { getTransactions, getTodayStats } = require('../controllers/transactionController');

router.get('/today', getTodayStats);
router.get('/', getTransactions);

module.exports = router;
