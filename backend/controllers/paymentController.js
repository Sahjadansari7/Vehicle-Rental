const axios = require('axios');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { createNotification } = require('../services/notificationService');

// @desc    Initiate Khalti Payment
// @route   POST /api/payments/initiate
// @access  Private
const initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    // Fetch booking details
    const booking = await Booking.findById(bookingId).populate('vehicle').populate('user');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Khalti expects the amount in PAISA (1 NPR = 100 paisa)
    const amountInPaisa = Math.round(booking.totalPrice * 100);

    // Prepare Khalti request payload
    const khaltiPayload = {
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-callback`,
      website_url: process.env.CLIENT_URL || 'http://localhost:5173',
      amount: amountInPaisa,
      purchase_order_id: booking._id.toString(),
      purchase_order_name: `Vehicle Rental - Booking ${booking.bookingId}`,
      customer_info: {
        name: booking.user.name,
        email: booking.user.email,
      },
    };

    const khaltiSecret = process.env.KHALTI_SECRET_KEY;
    const isMock = !khaltiSecret || khaltiSecret.includes('placeholder');

    if (isMock) {
      // DEV SIMULATION MODE
      console.log('--- KHALTI SIMULATION MODE ACTIVE ---');
      const simulatedPidx = `mock_pidx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const simulatedPaymentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-callback?pidx=${simulatedPidx}&transaction_id=mock_tx_${Date.now()}&amount=${amountInPaisa}&purchase_order_id=${booking._id}`;

      await Payment.create({
        booking: booking._id,
        pidx: simulatedPidx,
        amount: booking.totalPrice,
        status: 'Pending',
      });

      return res.json({
        success: true,
        message: 'Simulation payment initiated successfully',
        data: {
          pidx: simulatedPidx,
          payment_url: simulatedPaymentUrl,
          isSimulated: true,
        },
      });
    }

    // REAL KHALTI SANDBOX INTEGRATION
    try {
      const response = await axios.post(
        'https://a.khalti.com/api/v2/epayment/initiate/',
        khaltiPayload,
        {
          headers: {
            Authorization: `Key ${khaltiSecret}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await Payment.create({
        booking: booking._id,
        pidx: response.data.pidx,
        amount: booking.totalPrice,
        status: 'Pending',
      });

      res.json({
        success: true,
        message: 'Khalti payment initiated successfully',
        data: {
          pidx: response.data.pidx,
          payment_url: response.data.payment_url,
          isSimulated: false,
        },
      });
    } catch (apiError) {
      console.error('Khalti API Error Details:', apiError.response?.data || apiError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate payment with Khalti API.',
        error: apiError.response?.data || apiError.message,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Verify Payment Status (Lookup / Callback Verification)
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { pidx, transactionId } = req.body;

    if (!pidx) {
      return res.status(400).json({ success: false, message: 'pidx is required' });
    }

    const payment = await Payment.findOne({ pidx }).populate('booking');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found in system' });
    }

    const booking = await Booking.findById(payment.booking._id).populate('vehicle').populate('user');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Associated booking not found' });
    }

    if (payment.status === 'Completed') {
      return res.json({
        success: true,
        message: 'Payment has already been successfully verified.',
        data: { booking, payment },
      });
    }

    const khaltiSecret = process.env.KHALTI_SECRET_KEY;
    const isMock = !khaltiSecret || khaltiSecret.includes('placeholder') || pidx.startsWith('mock_');

    if (isMock) {
      // DEV SIMULATION MODE: Auto-confirm simulated payments!
      console.log('--- VERIFYING SIMULATED PAYMENT ---');

      payment.status = 'Completed';
      payment.transactionId = transactionId || `mock_tx_${Date.now()}`;
      await payment.save();

      booking.bookingStatus = 'Confirmed';
      await booking.save();

      const vehicle = await Vehicle.findById(booking.vehicle);
      if (vehicle) {
        vehicle.status = 'rented';
        await vehicle.save();
      }

      // --- Send payment success + booking confirmed notification ---
      const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.name}` : 'your vehicle';
      const pickupFormatted = new Date(booking.pickupDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
      const returnFormatted = new Date(booking.returnDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });

      await createNotification({
        userId: booking.user._id,
        title: '✅ Payment Successful & Booking Confirmed!',
        message: `Payment of NRS ${payment.amount} received. Your booking for ${vehicleName} from ${pickupFormatted} to ${returnFormatted} is now confirmed (Booking #${booking.bookingId}).`,
        type: 'booking_confirmed',
        bookingId: booking._id,
        vehicleId: vehicle?._id,
      });

      // --- Send notification to admins ---
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' });
      const customerName = booking.user?.name || 'A customer';
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          title: '💰 Booking Confirmed & Paid',
          message: `Payment of NRS ${payment.amount} received from ${customerName}. Booking #${booking.bookingId} for ${vehicleName} is now confirmed.`,
          type: 'booking_confirmed',
          bookingId: booking._id,
          vehicleId: vehicle?._id,
        });
      }

      return res.json({
        success: true,
        message: 'Payment simulation verified and booking confirmed!',
        data: { booking, payment },
      });
    }

    // REAL KHALTI SANDBOX VERIFICATION LOOKUP
    try {
      const response = await axios.post(
        'https://a.khalti.com/api/v2/epayment/lookup/',
        { pidx },
        {
          headers: {
            Authorization: `Key ${khaltiSecret}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const khaltiStatus = response.data.status;

      if (khaltiStatus === 'Completed') {
        payment.status = 'Completed';
        payment.transactionId = response.data.transaction_id;
        await payment.save();

        booking.bookingStatus = 'Confirmed';
        await booking.save();

        const vehicle = await Vehicle.findById(booking.vehicle);
        if (vehicle) {
          vehicle.status = 'rented';
          await vehicle.save();
        }

        // --- Send payment success + booking confirmed notification ---
        const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.name}` : 'your vehicle';
        const pickupFormatted = new Date(booking.pickupDate).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        });
        const returnFormatted = new Date(booking.returnDate).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        });

        await createNotification({
          userId: booking.user._id,
          title: '✅ Payment Successful & Booking Confirmed!',
          message: `Payment of NRS ${payment.amount} received. Your booking for ${vehicleName} from ${pickupFormatted} to ${returnFormatted} is now confirmed (Booking #${booking.bookingId}).`,
          type: 'booking_confirmed',
          bookingId: booking._id,
          vehicleId: vehicle?._id,
        });

        // --- Send notification to admins ---
        const User = require('../models/User');
        const admins = await User.find({ role: 'admin' });
        const customerName = booking.user?.name || 'A customer';
        for (const admin of admins) {
          await createNotification({
            userId: admin._id,
            title: '💰 Booking Confirmed & Paid',
            message: `Payment of NRS ${payment.amount} received from ${customerName}. Booking #${booking.bookingId} for ${vehicleName} is now confirmed.`,
            type: 'booking_confirmed',
            bookingId: booking._id,
            vehicleId: vehicle?._id,
          });
        }

        res.json({
          success: true,
          message: 'Payment successfully verified by Khalti and booking is confirmed!',
          data: { booking, payment },
        });
      } else {
        payment.status = khaltiStatus;
        await payment.save();

        res.status(400).json({
          success: false,
          message: `Payment verification failed. Khalti status: ${khaltiStatus}`,
          data: response.data,
        });
      }
    } catch (apiError) {
      console.error('Khalti Lookup API Error:', apiError.response?.data || apiError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment with Khalti API.',
        error: apiError.response?.data || apiError.message,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
};
