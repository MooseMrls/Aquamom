const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Gallon = require('../models/Gallon');

// GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { action, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const filter = {};

    // Filter by Action
    if (action && action.trim()) {
      filter.action = action.trim();
    }

    // Filter by Date Range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Extend to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Search by Customer Name or Gallon QR Code
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      // 1. Find matching customers
      const matchedCustomers = await Customer.find({ name: searchRegex }).select('_id');
      const customerIds = matchedCustomers.map((c) => c._id);

      // 2. Find matching gallons
      const matchedGallons = await Gallon.find({ qrCode: searchRegex }).select('_id');
      const gallonIds = matchedGallons.map((g) => g._id);

      filter.$or = [
        { customer: { $in: customerIds } },
        { gallon: { $in: gallonIds } },
        { note: searchRegex }
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skipNum = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('gallon', 'qrCode size price deliveryStatus paymentStatus')
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions.', error: err.message });
  }
};

// GET /api/transactions/today
exports.getTodayStats = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Query all transactions from today
    const transactions = await Transaction.find({
      createdAt: { $gte: start, $lte: end },
    })
      .populate('gallon', 'qrCode size price deliveryStatus paymentStatus')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    // Group transactions by gallon to get unique active gallons
    const uniqueGallonsMap = {};
    let refillsCount = 0;
    let walkInGallonsCount = 0;
    let walkInRevenue = 0;

    transactions.forEach((t) => {
      if (t.isWalkIn) {
        walkInGallonsCount += t.walkInDetails?.quantity || 0;
        walkInRevenue += t.walkInDetails?.totalAmount || 0;
      } else if (t.gallon) {
        const gallonId = String(t.gallon._id);
        if (!uniqueGallonsMap[gallonId]) {
          uniqueGallonsMap[gallonId] = {
            gallon: t.gallon,
            hasReturned: false,
          };
        }
        if (t.action === 'returned') {
          uniqueGallonsMap[gallonId].hasReturned = true;
        }
      }
    });

    let deliveriesCount = 0;
    let undeliveredCount = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let standardPaymentsRevenue = 0;

    Object.values(uniqueGallonsMap).forEach((item) => {
      if (item.hasReturned) {
        refillsCount++;
      }
      if (item.gallon.deliveryStatus === 'delivered') {
        deliveriesCount++;
      } else {
        undeliveredCount++;
      }
      if (item.gallon.paymentStatus === 'paid') {
        paidCount++;
        standardPaymentsRevenue += item.gallon.price || 25;
      } else {
        unpaidCount++;
      }
    });

    const totalRevenue = standardPaymentsRevenue + walkInRevenue;
    const totalRefillsIncludingWalkIn = refillsCount + walkInGallonsCount;

    res.json({
      refillsCount,
      walkInGallonsCount,
      totalRefillsIncludingWalkIn,
      deliveriesCount,
      undeliveredCount,
      paidCount,
      unpaidCount,
      standardPaymentsRevenue,
      walkInRevenue,
      totalRevenue,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch today's statistics.", error: err.message });
  }
};
