const RentalLocation = require('../models/RentalLocation');
const { getNearestLocations } = require('../services/locationService');

// @desc    Get all rental locations (with optional nearest branch calculation using Dijkstra)
// @route   GET /api/locations
// @access  Public
const getLocations = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // If coordinates are provided, run Dijkstra's nearest finder algorithm!
    if (lat && lng) {
      const nearest = await getNearestLocations(Number(lat), Number(lng));
      return res.json({ success: true, count: nearest.length, data: nearest });
    }

    const locations = await RentalLocation.find().populate('availableVehicles');
    res.json({ success: true, count: locations.length, data: locations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single rental location by ID
// @route   GET /api/locations/:id
// @access  Public
const getLocationById = async (req, res) => {
  try {
    const location = await RentalLocation.findById(req.params.id).populate('availableVehicles');
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new rental location
// @route   POST /api/locations
// @access  Private/Admin
const createLocation = async (req, res) => {
  try {
    const { name, latitude, longitude, availableVehicles } = req.body;

    // Validate coordinates
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Coordinates are required' });
    }

    const location = await RentalLocation.create({
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
      availableVehicles: availableVehicles || [],
    });

    res.status(201).json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update rental location
// @route   PUT /api/locations/:id
// @access  Private/Admin
const updateLocation = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.latitude !== undefined) updateData.latitude = Number(updateData.latitude);
    if (updateData.longitude !== undefined) updateData.longitude = Number(updateData.longitude);

    const location = await RentalLocation.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete rental location
// @route   DELETE /api/locations/:id
// @access  Private/Admin
const deleteLocation = async (req, res) => {
  try {
    const location = await RentalLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    await location.deleteOne();
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add vehicle to a rental location
// @route   POST /api/locations/:id/vehicles
// @access  Private/Admin
const addVehicleToLocation = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const location = await RentalLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (location.availableVehicles.includes(vehicleId)) {
      return res.status(400).json({ success: false, message: 'Vehicle already added to this location' });
    }

    location.availableVehicles.push(vehicleId);
    await location.save();

    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  addVehicleToLocation,
};
