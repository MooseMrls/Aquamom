const express = require('express');
const router = express.Router();
const { createWalkInSale, getWalkInSales } = require('../controllers/walkInController');

router.post('/', createWalkInSale);
router.get('/', getWalkInSales);

module.exports = router;
