const mongoose = require('mongoose');

// A running log of everything that happens to a gallon, so both staff
// and customers can see a clear history of gallons coming and going.
const transactionSchema = new mongoose.Schema(
  {
    gallon: { type: mongoose.Schema.Types.ObjectId, ref: 'Gallon', default: null },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    action: {
      type: String,
      enum: [
        'registered',
        'returned',
        'assigned',
        'delivered',
        'marked_undelivered',
        'paid',
        'marked_unpaid',
        'walkin_sale',
      ],
      required: true,
    },
    note: { type: String, default: '' },
    isWalkIn: { type: Boolean, default: false },
    walkInDetails: {
      size: { type: String, default: 'Round' },
      quantity: { type: Number, default: 1 },
      pricePerUnit: { type: Number, default: 25 },
      totalAmount: { type: Number, default: 25 },
    },
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
