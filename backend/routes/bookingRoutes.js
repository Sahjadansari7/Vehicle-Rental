const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All booking routes require authentication

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
