const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Bike', 'Car', 'SUV', 'EV'],
      required: true
    },
    brand: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: null
    }, // Stored as full URL
    fuelType: {
      type: String,
      required: true
    },
    rentPerDay: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'rented', 'maintenance'],
      default: 'available'
    },
    fuelEfficiency: {
      type: Number,
      default: 15 // average efficiency (km/l or km/kWh for EV)
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
