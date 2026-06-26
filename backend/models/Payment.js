const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    pidx: {
      type: String,
      required: true,
      unique: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    amount: {
      type: Number,
      required: true, // Stores the total amount paid
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
