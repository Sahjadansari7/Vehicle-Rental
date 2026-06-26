const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    pickupLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalLocation',
      required: true,
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

// Auto-generate Booking ID before saving
bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digit number
    this.bookingId = `VR-${randomNum}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
