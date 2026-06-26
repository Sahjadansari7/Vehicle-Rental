const mongoose = require('mongoose');

const rentalLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a location name'],
      unique: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Please add latitude coordinates'],
    },
    longitude: {
      type: Number,
      required: [true, 'Please add longitude coordinates'],
    },
    availableVehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('RentalLocation', rentalLocationSchema);
