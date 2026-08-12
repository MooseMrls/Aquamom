const Transaction = require('../models/Transaction');

// POST /api/walkins
exports.createWalkInSale = async (req, res) => {
  try {
    const { size, quantity, pricePerUnit, note } = req.body;

    const qty = Math.max(1, parseInt(quantity || 1));
    const price = Math.max(0, parseFloat(pricePerUnit || 30));
    const total = qty * price;

    const actionNote = note && note.trim()
      ? note.trim()
      : `Walk-in sale: ${qty}x ${size || 'Round'} (PHP ${total} total)`;

    const transaction = await Transaction.create({
      action: 'walkin_sale',
      note: actionNote,
      isWalkIn: true,
      walkInDetails: {
        size: size || 'Round',
        quantity: qty,
        pricePerUnit: price,
        totalAmount: total,
      },
    });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Failed to record walk-in sale.', error: err.message });
  }
};

// GET /api/walkins
// Returns walk-in sales (optionally just for today)
exports.getWalkInSales = async (req, res) => {
  try {
    const { todayOnly } = req.query;
    const filter = { isWalkIn: true };

    if (todayOnly === 'true') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const sales = await Transaction.find(filter).sort({ createdAt: -1 }).lean();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch walk-in sales.', error: err.message });
  }
};
