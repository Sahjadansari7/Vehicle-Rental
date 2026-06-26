const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'booking_created',
        'booking_confirmed',
        'booking_cancelled',
        'payment_success',
        'vehicle_deleted',
        'vehicle_updated',
        'refund_processed',
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    relatedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
