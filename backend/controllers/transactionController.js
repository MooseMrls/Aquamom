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

    // Aquamom reuses one Gallon document per physical container across many
    // refill cycles (scan in -> deliver -> pay -> scan in again...), so we
    // must tally each event as it happened rather than deduping by gallon
    // and reading its current live status. Reading current status would
    // make a second same-day scan erase the first cycle's delivery/payment
    // instead of adding a new cycle on top of it.
    let refillsCount = 0;
    let walkInGallonsCount = 0;
    let walkInRevenue = 0;
    let deliveriesCount = 0;
    let paidCount = 0;
    let standardPaymentsRevenue = 0;

    transactions.forEach((t) => {
      if (t.isWalkIn) {
        walkInGallonsCount += t.walkInDetails?.quantity || 0;
        walkInRevenue += t.walkInDetails?.totalAmount || 0;
        return;
      }
      if (!t.gallon) return;

      switch (t.action) {
        case 'returned':
          // Every scan-in starts a new refill cycle for this gallon, even
          // if the same physical gallon was scanned in more than once today.
          refillsCount += 1;
          break;
        case 'delivered':
          deliveriesCount += 1;
          break;
        case 'paid':
          paidCount += 1;
          standardPaymentsRevenue += t.gallon.price || 25;
          break;
        default:
          break;
      }
    });

    const totalRevenue = standardPaymentsRevenue + walkInRevenue;
    const totalRefillsIncludingWalkIn = refillsCount + walkInGallonsCount;

    res.json({
      refillsCount,
      walkInGallonsCount,
      totalRefillsIncludingWalkIn,
      deliveriesCount,
      paidCount,
      standardPaymentsRevenue,
      walkInRevenue,
      totalRevenue,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch today's statistics.", error: err.message });
  }
};