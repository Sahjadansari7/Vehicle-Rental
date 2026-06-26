const express = require('express');
const router = express.Router();
const {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  addVehicleToLocation,
} = require('../controllers/locationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getLocations);
router.get('/:id', getLocationById);

// Admin routes
router.post('/', protect, adminOnly, createLocation);
router.put('/:id', protect, adminOnly, updateLocation);
router.delete('/:id', protect, adminOnly, deleteLocation);
router.post('/:id/vehicles', protect, adminOnly, addVehicleToLocation);

module.exports = router;
