const QRCode = require('qrcode');
const Gallon = require('../models/Gallon');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const { generateGallonCode } = require('../utils/generateCode');

const logTransaction = (gallonId, customerId, action, note) =>
  Transaction.create({ gallon: gallonId, customer: customerId || null, action, note });

// POST /api/gallons
// Registers a brand new gallon into the system and assigns it a QR code.
exports.createGallon = async (req, res) => {
  try {
    const { customer, size, price, qrCode } = req.body;

    const code = qrCode && qrCode.trim() ? qrCode.trim().toUpperCase() : generateGallonCode();
    const existing = await Gallon.findOne({ qrCode: code });
    if (existing) {
      return res.status(400).json({ message: 'This QR code is already registered to a gallon.' });
    }

    if (customer) {
      const customerExists = await Customer.findById(customer);
      if (!customerExists) return res.status(400).json({ message: 'Selected customer was not found.' });
    }

    const gallon = await Gallon.create({
      qrCode: code,
      customer: customer || null,
      size: size || 'Round',
      price: price !== undefined && price !== '' ? price : 25,
    });

    await logTransaction(gallon._id, customer, 'registered', 'Gallon registered into the system.');

    const populated = await Gallon.findById(gallon._id).populate('customer', 'name phone');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to register gallon.', error: err.message });
  }
};

// GET /api/gallons
exports.getGallons = async (req, res) => {
  try {
    const { search, locationStatus, deliveryStatus, paymentStatus, customer } = req.query;
    const filter = {};
    if (locationStatus) filter.locationStatus = locationStatus;
    if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (customer) filter.customer = customer;
    if (search && search.trim()) filter.qrCode = { $regex: search.trim(), $options: 'i' };

    const gallons = await Gallon.find(filter)
      .populate('customer', 'name phone')
      .sort({ updatedAt: -1 })
      .lean();

    res.json(gallons);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch gallons.', error: err.message });
  }
};

// GET /api/gallons/:id
exports.getGallonById = async (req, res) => {
  try {
    const gallon = await Gallon.findById(req.params.id).populate('customer', 'name phone address');
    if (!gallon) return res.status(404).json({ message: 'Gallon not found.' });
    const history = await Transaction.find({ gallon: gallon._id }).sort({ createdAt: -1 }).lean();
    res.json({ gallon, history });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch gallon.', error: err.message });
  }
};

// POST /api/gallons/scan
// Called every time a gallon is physically scanned back into the station.
// This is the core "gallon comes and goes" monitoring action.
exports.scanGallon = async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode || !qrCode.trim()) {
      return res.status(400).json({ message: 'No QR code was captured.' });
    }
    const code = qrCode.trim().toUpperCase();

    const gallon = await Gallon.findOne({ qrCode: code }).populate('customer', 'name phone');
    if (!gallon) {
      return res.status(404).json({
        message: 'This QR code is not yet registered in the system.',
        qrCode: code,
        notFound: true,
      });
    }

    gallon.locationStatus = 'at_station';
    gallon.deliveryStatus = 'undelivered';
    gallon.paymentStatus = 'unpaid';
    gallon.lastScannedAt = new Date();
    await gallon.save();

    await logTransaction(gallon._id, gallon.customer, 'returned', 'Gallon scanned in for refilling.');

    res.json({ message: 'Gallon received at the station for refilling.', gallon });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process scan.', error: err.message });
  }
};

// PATCH /api/gallons/:id
// Updates customer assignment, delivery status, and payment status.
exports.updateGallon = async (req, res) => {
  try {
    const gallon = await Gallon.findById(req.params.id);
    if (!gallon) return res.status(404).json({ message: 'Gallon not found.' });

    const { customer, size, price, deliveryStatus, paymentStatus, notes } = req.body;

    if (customer !== undefined && String(customer || '') !== String(gallon.customer || '')) {
      gallon.customer = customer || null;
      await logTransaction(gallon._id, customer, 'assigned', 'Gallon assigned to customer.');
    }
    if (size) gallon.size = size;
    if (price !== undefined && price !== '') gallon.price = price;
    if (notes !== undefined) gallon.notes = notes;

    if (deliveryStatus && deliveryStatus !== gallon.deliveryStatus) {
      gallon.deliveryStatus = deliveryStatus;
      if (deliveryStatus === 'delivered') {
        gallon.locationStatus = 'with_customer';
        await logTransaction(gallon._id, gallon.customer, 'delivered', 'Gallon marked as delivered.');
      } else {
        await logTransaction(gallon._id, gallon.customer, 'marked_undelivered', 'Gallon marked as undelivered.');
      }
    }

    if (paymentStatus && paymentStatus !== gallon.paymentStatus) {
      gallon.paymentStatus = paymentStatus;
      await logTransaction(
        gallon._id,
        gallon.customer,
        paymentStatus === 'paid' ? 'paid' : 'marked_unpaid',
        paymentStatus === 'paid' ? 'Payment received.' : 'Gallon marked as unpaid.'
      );
    }

    await gallon.save();
    const populated = await Gallon.findById(gallon._id).populate('customer', 'name phone');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update gallon.', error: err.message });
  }
};

// DELETE /api/gallons/:id
exports.deleteGallon = async (req, res) => {
  try {
    const gallon = await Gallon.findByIdAndDelete(req.params.id);
    if (!gallon) return res.status(404).json({ message: 'Gallon not found.' });
    await Transaction.deleteMany({ gallon: gallon._id });
    res.json({ message: 'Gallon removed from the system.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete gallon.', error: err.message });
  }
};

// GET /api/gallons/:id/qr
// Generates a printable QR code image for a gallon's label.
exports.getGallonQr = async (req, res) => {
  try {
    const gallon = await Gallon.findById(req.params.id);
    if (!gallon) return res.status(404).json({ message: 'Gallon not found.' });
    const image = await QRCode.toDataURL(gallon.qrCode, { width: 320, margin: 2 });
    res.json({ qrCode: gallon.qrCode, image });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate QR image.', error: err.message });
  }
};

// GET /api/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalGallons, atStation, withCustomer, delivered, undelivered, paid, unpaid, totalCustomers] =
      await Promise.all([
        Gallon.countDocuments(),
        Gallon.countDocuments({ locationStatus: 'at_station' }),
        Gallon.countDocuments({ locationStatus: 'with_customer' }),
        Gallon.countDocuments({ deliveryStatus: 'delivered' }),
        Gallon.countDocuments({ deliveryStatus: 'undelivered' }),
        Gallon.countDocuments({ paymentStatus: 'paid' }),
        Gallon.countDocuments({ paymentStatus: 'unpaid' }),
        Customer.countDocuments(),
      ]);

    const unpaidGallons = await Gallon.find({ paymentStatus: 'unpaid' }).select('price').lean();
    const unpaidBalance = unpaidGallons.reduce((sum, g) => sum + (g.price || 0), 0);

    const recentTransactions = await Transaction.find()
      .populate('gallon', 'qrCode')
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    res.json({
      totalGallons,
      atStation,
      withCustomer,
      delivered,
      undelivered,
      paid,
      unpaid,
      unpaidBalance,
      totalCustomers,
      recentTransactions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard statistics.', error: err.message });
  }
};
