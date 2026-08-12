const mongoose = require('mongoose');

const gallonSchema = new mongoose.Schema(
  {
    qrCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    size: { type: String, default: 'Round' },
    price: { type: Number, default: 30, min: 0 },

    // Physical location of the gallon: whether it is currently at the
    // station (returned for refilling) or out with a customer.
    locationStatus: {
      type: String,
      enum: ['at_station', 'with_customer'],
      default: 'at_station',
    },

    // Delivery status of the current refill order for this gallon.
    deliveryStatus: {
      type: String,
      enum: ['delivered', 'undelivered'],
      default: 'undelivered',
    },

    // Payment status of the current refill order for this gallon.
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid'],
      default: 'unpaid',
    },

    lastScannedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

gallonSchema.index({ qrCode: 1 });
gallonSchema.index({ customer: 1 });

module.exports = mongoose.model('Gallon', gallonSchema);
