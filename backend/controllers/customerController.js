const Customer = require('../models/Customer');
const Gallon = require('../models/Gallon');

// POST /api/customers
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Customer name is required.' });
    }
    const customer = await Customer.create({
      name: name.trim(),
      phone: phone || '',
      address: address || '',
    });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create customer.', error: err.message });
  }
};

// GET /api/customers
// Returns a paginated page of customers with computed gallon counts and
// unpaid balance, plus the outstanding-balance/customer-count totals across
// the whole directory (unaffected by search/filter) for the summary banner.
// Computed with a $lookup aggregation instead of pulling every gallon into
// Node and cross-referencing it in JS, which is what made this page slow.
exports.getCustomers = async (req, res) => {
  try {
    const { search, unpaidOnly, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const matchStage = {};
    if (search && search.trim()) {
      matchStage.name = new RegExp(search.trim(), 'i');
    }

    const withStatsPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'gallons',
          localField: '_id',
          foreignField: 'customer',
          as: 'gallons',
        },
      },
      {
        $addFields: {
          totalGallons: { $size: '$gallons' },
          unpaidCount: {
            $size: { $filter: { input: '$gallons', as: 'g', cond: { $eq: ['$$g.paymentStatus', 'unpaid'] } } },
          },
          undeliveredCount: {
            $size: { $filter: { input: '$gallons', as: 'g', cond: { $eq: ['$$g.deliveryStatus', 'undelivered'] } } },
          },
          unpaidBalance: {
            $sum: {
              $map: {
                input: { $filter: { input: '$gallons', as: 'g', cond: { $eq: ['$$g.paymentStatus', 'unpaid'] } } },
                as: 'g',
                in: '$$g.price',
              },
            },
          },
        },
      },
      { $project: { gallons: 0 } },
    ];

    if (unpaidOnly === 'true') {
      withStatsPipeline.push({ $match: { unpaidBalance: { $gt: 0 } } });
    }

    const [page1] = await Customer.aggregate([
      ...withStatsPipeline,
      { $sort: { name: 1 } },
      {
        $facet: {
          data: [{ $skip: (pageNum - 1) * limitNum }, { $limit: limitNum }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const customers = page1?.data || [];
    const total = page1?.totalCount?.[0]?.count || 0;

    const [globalStats] = await Customer.aggregate([
      {
        $lookup: {
          from: 'gallons',
          localField: '_id',
          foreignField: 'customer',
          as: 'gallons',
        },
      },
      {
        $project: {
          unpaidBalance: {
            $sum: {
              $map: {
                input: { $filter: { input: '$gallons', as: 'g', cond: { $eq: ['$$g.paymentStatus', 'unpaid'] } } },
                as: 'g',
                in: '$$g.price',
              },
            },
          },
        },
      },
      { $group: { _id: null, totalOutstanding: { $sum: '$unpaidBalance' }, totalCustomers: { $sum: 1 } } },
    ]);

    res.json({
      customers,
      total,
      page: pageNum,
      pages: Math.max(Math.ceil(total / limitNum), 1),
      totalOutstanding: globalStats?.totalOutstanding || 0,
      totalCustomers: globalStats?.totalCustomers || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers.', error: err.message });
  }
};

// GET /api/customers/:id
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    const gallons = await Gallon.find({ customer: customer._id }).sort({ updatedAt: -1 }).lean();
    res.json({ customer, gallons });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customer.', error: err.message });
  }
};

// PATCH /api/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, address },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update customer.', error: err.message });
  }
};

// DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const inUse = await Gallon.countDocuments({ customer: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({
        message: 'This customer still has gallon records on file. Reassign or remove those gallons first.',
      });
    }
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json({ message: 'Customer deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete customer.', error: err.message });
  }
};

// GET /api/customers/lookup?name=...
// Public, unauthenticated endpoint used by the customer-facing lookup page.
// Only exposes each customer's name and gallon status - no contact details.
exports.lookupCustomers = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Please enter a name to search.' });
    }

    const customers = await Customer.find({
      name: { $regex: name.trim(), $options: 'i' },
    }).lean();

    if (customers.length === 0) {
      return res.json([]);
    }

    const results = await Promise.all(
      customers.map(async (c) => {
        const gallons = await Gallon.find({ customer: c._id })
          .sort({ updatedAt: -1 })
          .select('qrCode size price locationStatus deliveryStatus paymentStatus updatedAt')
          .lean();
        const unpaidGallons = gallons.filter((g) => g.paymentStatus === 'unpaid');
        const undeliveredGallons = gallons.filter((g) => g.deliveryStatus === 'undelivered');
        const unpaidBalance = unpaidGallons.reduce((sum, g) => sum + (g.price || 0), 0);

        return {
          customer: { _id: c._id, name: c.name },
          totalGallons: gallons.length,
          gallons,
          unpaidGallons,
          undeliveredGallons,
          unpaidBalance,
        };
      })
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to look up customer.', error: err.message });
  }
};