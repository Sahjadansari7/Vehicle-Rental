const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { calculatePricing } = require('../services/pricingService');
const { createNotification } = require('../services/notificationService');

// @desc    Create a new booking (draft / pending payment)
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { vehicleId, pickupLocationId, pickupDate, returnDate } = req.body;
    const userId = req.user._id;

    if (!vehicleId || !pickupLocationId || !pickupDate || !returnDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);

    // Validate dates
    if (pickup < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ success: false, message: 'Pickup date cannot be in the past' });
    }

    if (pickup >= returnD) {
      return res.status(400).json({ success: false, message: 'Return date must be after pickup date' });
    }

    // Fetch vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (vehicle.status === 'maintenance') {
      return res.status(400).json({ success: false, message: 'Vehicle is currently undergoing maintenance' });
    }

    // Prevent double booking!
    const overlappingBooking = await Booking.findOne({
      vehicle: vehicleId,
      bookingStatus: 'Confirmed',
      pickupDate: { $lte: returnD },
      returnDate: { $gte: pickup },
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This vehicle is already booked for the selected dates. Please choose another vehicle or date range.',
      });
    }

    // Calculate dynamic pricing (Greedy Algorithm)
    const pricingDetails = calculatePricing(vehicle, pickupDate, returnDate);

    // Create the booking draft (Pending status)
    const booking = await Booking.create({
      user: userId,
      vehicle: vehicleId,
      pickupLocation: pickupLocationId,
      pickupDate: pickup,
      returnDate: returnD,
      totalPrice: pricingDetails.finalPrice,
      bookingStatus: 'Pending',
    });

    // --- Send notification to user ---
    const pickupFormatted = pickup.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const returnFormatted = returnD.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    await createNotification({
      userId,
      title: '🚗 Booking Created',
      message: `Your booking for ${vehicle.brand} ${vehicle.name} (${pickupFormatted} → ${returnFormatted}) has been reserved. Complete payment to confirm.`,
      type: 'booking_created',
      bookingId: booking._id,
      vehicleId: vehicle._id,
    });

    // --- Send notification to admins ---
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        title: '📋 New Booking Created',
        message: `A new booking (Booking #${booking.bookingId}) has been reserved for ${vehicle.brand} ${vehicle.name} by ${req.user.name}.`,
        type: 'booking_created',
        bookingId: booking._id,
        vehicleId: vehicle._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking draft created successfully. Proceed to payment.',
      data: { booking, pricingDetails },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get booking history for the current user or all bookings for admin
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    let query = {};

    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('vehicle')
      .populate('pickupLocation')
      .sort({ createdAt: -1 });

    const bookingsWithPayment = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await Payment.findOne({ booking: booking._id });
        return {
          ...booking.toObject(),
          payment: payment ? { status: payment.status, amount: payment.amount, pidx: payment.pidx } : null,
        };
      })
    );

    res.json({ success: true, count: bookingsWithPayment.length, data: bookingsWithPayment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('vehicle')
      .populate('pickupLocation');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Cancel booking (only allowed BEFORE the pickup date) + auto-refund if paid
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const booking = await Booking.findById(req.params.id).populate('vehicle');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    if (booking.bookingStatus === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed bookings cannot be cancelled' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pickup = new Date(booking.pickupDate);
    pickup.setHours(0, 0, 0, 0);

    if (today >= pickup) {
      return res.status(400).json({
        success: false,
        message: 'Bookings can only be cancelled before the scheduled pickup date.',
      });
    }

    let refundProcessed = false;
    let refundAmount = 0;
    const payment = await Payment.findOne({ booking: booking._id, status: 'Completed' });

    if (payment) {
      payment.status = 'Refunded';
      await payment.save();
      refundProcessed = true;
      refundAmount = payment.amount;
      console.log(`[Refund] Payment ${payment._id} for booking ${booking.bookingId} marked as Refunded. Amount: NRS ${refundAmount}`);
    }

    booking.bookingStatus = 'Cancelled';
    await booking.save();

    const vehicle = await Vehicle.findById(booking.vehicle._id);
    if (vehicle && vehicle.status === 'rented') {
      vehicle.status = 'available';
      await vehicle.save();
    }

    // --- Send notification to user ---
    const targetUserId = booking.user;
    const isAdminAction = req.user.role === 'admin';
    const vehicleName = booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.name}` : 'your vehicle';

    if (refundProcessed) {
      await createNotification({
        userId: targetUserId,
        title: '💸 Booking Cancelled & Refund Issued',
        message: `${isAdminAction ? 'Admin cancelled' : 'You cancelled'} your booking for ${vehicleName}. A refund of NRS ${refundAmount} has been processed.`,
        type: 'refund_processed',
        bookingId: booking._id,
        vehicleId: booking.vehicle?._id,
      });
    } else {
      await createNotification({
        userId: targetUserId,
        title: '❌ Booking Cancelled',
        message: `${isAdminAction ? 'Admin cancelled' : 'You cancelled'} your booking for ${vehicleName} (Booking #${booking.bookingId}).`,
        type: 'booking_cancelled',
        bookingId: booking._id,
        vehicleId: booking.vehicle?._id,
      });
    }

    // --- Send notification to admins if user cancelled ---
    if (!isAdminAction) {
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          title: refundProcessed ? '💸 Booking Cancelled by Customer (Refunded)' : '❌ Booking Cancelled by Customer',
          message: `Customer ${req.user.name} cancelled booking #${booking.bookingId} for ${vehicleName}.` + (refundProcessed ? ` Refund of NRS ${refundAmount} has been processed.` : ''),
          type: refundProcessed ? 'refund_processed' : 'booking_cancelled',
          bookingId: booking._id,
          vehicleId: booking.vehicle?._id,
        });
      }
    }

    const message = refundProcessed
      ? `Booking cancelled successfully. Refund of NRS ${refundAmount} has been processed to your original payment method.`
      : 'Booking cancelled successfully.';

    res.json({
      success: true,
      message,
      data: {
        booking,
        refund: { processed: refundProcessed, amount: refundAmount },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
};
