const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { getGreedyAllocations, calculatePricing } = require('../services/pricingService');
const { createNotification } = require('../services/notificationService');

// @desc    Get all vehicles (with filters & optional greedy optimization sorting)
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  try {
    const { search, type, status, greedy, pickupDate, returnDate } = req.query;
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    let vehicles = await Vehicle.find(query);

    if (greedy === 'true') {
      const availableOnly = vehicles.filter(v => v.status === 'available');
      vehicles = getGreedyAllocations(availableOnly, type);
    }

    let data = vehicles;
    if (pickupDate && returnDate) {
      data = vehicles.map(vehicle => {
        const pricing = calculatePricing(vehicle, pickupDate, returnDate);
        return { ...vehicle.toObject(), pricing };
      });
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const { pickupDate, returnDate } = req.query;
    let result = vehicle.toObject();

    if (pickupDate && returnDate) {
      result.pricing = calculatePricing(vehicle, pickupDate, returnDate);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new vehicle
// @route   POST /api/vehicles
// @access  Private/Admin
const createVehicle = async (req, res) => {
  try {
    const { name, type, brand, model, fuelType, rentPerDay, fuelEfficiency } = req.body;

    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/vehicles/${req.file.filename}`
      : null;

    const vehicle = await Vehicle.create({
      name,
      type,
      brand,
      model,
      fuelType,
      rentPerDay: Number(rentPerDay),
      fuelEfficiency: fuelEfficiency ? Number(fuelEfficiency) : 15,
      image: imageUrl,
      status: 'available',
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update an existing vehicle
// @route   PUT /api/vehicles/:id
// @access  Private/Admin
const updateVehicle = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.rentPerDay) updateData.rentPerDay = Number(updateData.rentPerDay);
    if (updateData.fuelEfficiency) updateData.fuelEfficiency = Number(updateData.fuelEfficiency);

    if (req.file) {
      updateData.image = `${req.protocol}://${req.get('host')}/uploads/vehicles/${req.file.filename}`;
    }

    const oldVehicle = await Vehicle.findById(req.params.id);
    if (!oldVehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // --- Notify users who have active (Confirmed/Pending) bookings on this vehicle ---
    const activeBookings = await Booking.find({
      vehicle: vehicle._id,
      bookingStatus: { $in: ['Confirmed', 'Pending'] },
    });

    const statusChanged = updateData.status && updateData.status !== oldVehicle.status;
    const changeDescription = statusChanged
      ? `The vehicle status has been changed to "${updateData.status}".`
      : 'Vehicle details have been updated by admin.';

    for (const booking of activeBookings) {
      await createNotification({
        userId: booking.user,
        title: '🔧 Your Booked Vehicle Was Updated',
        message: `Admin updated the ${vehicle.brand} ${vehicle.name} that you have booked (Booking #${booking.bookingId}). ${changeDescription} Please check your booking details.`,
        type: 'vehicle_updated',
        bookingId: booking._id,
        vehicleId: vehicle._id,
      });
    }

    res.json({ success: true, data: vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // --- Find users with active bookings on this vehicle and notify them BEFORE deleting ---
    const activeBookings = await Booking.find({
      vehicle: vehicle._id,
      bookingStatus: { $in: ['Confirmed', 'Pending'] },
    });

    for (const booking of activeBookings) {
      await createNotification({
        userId: booking.user,
        title: '⚠️ Booked Vehicle Removed',
        message: `The ${vehicle.brand} ${vehicle.name} you booked (Booking #${booking.bookingId}) has been removed by admin. Please contact support or book another vehicle.`,
        type: 'vehicle_deleted',
        bookingId: booking._id,
        vehicleId: vehicle._id,
      });
    }

    await vehicle.deleteOne();
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get recommended vehicle (Greedy Allocation Heuristic)
// @route   GET /api/vehicles/recommend/optimal
// @access  Public
const getOptimalRecommendation = async (req, res) => {
  try {
    const { type, pickupDate, returnDate } = req.query;

    const availableVehicles = await Vehicle.find({ status: 'available' });

    if (availableVehicles.length === 0) {
      return res.json({ success: true, message: 'No vehicles are currently available.', data: null });
    }

    const sorted = getGreedyAllocations(availableVehicles, type);

    if (sorted.length === 0) {
      return res.status(404).json({ success: false, message: `No vehicles of type '${type}' are currently available.` });
    }

    const bestChoice = sorted[0];
    let pricing = null;

    if (pickupDate && returnDate) {
      pricing = calculatePricing(bestChoice, pickupDate, returnDate);
    }

    res.json({
      success: true,
      data: {
        recommendation: bestChoice,
        pricing,
        alternatives: sorted.slice(1, 4),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getOptimalRecommendation,
};
