const mongoose = require('mongoose');

// A running log of everything that happens to a gallon, so both staff
// and customers can see a clear history of gallons coming and going.
const transactionSchema = new mongoose.Schema(
  {
    gallon: { type: mongoose.Schema.Types.ObjectId, ref: 'Gallon', required: true },
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
      ],
      required: true,
    },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
