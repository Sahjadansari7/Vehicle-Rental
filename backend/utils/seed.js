const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const RentalLocation = require('../models/RentalLocation');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vehicleRental');
    console.log('Connected to MongoDB for seeding...');

    // 1. Clear Database
    await User.deleteMany();
    await Vehicle.deleteMany();
    await RentalLocation.deleteMany();
    await Booking.deleteMany();
    await Payment.deleteMany();
    console.log('Database cleared.');

    // 2. Create Users
    const users = await User.create([
      {
        name: 'System Admin',
        email: 'admin@gmail.com',
        password: 'admin1234', // Will be hashed automatically by pre-save hooks
        role: 'admin',
        latitude: 27.7172,
        longitude: 85.3240,
      },
      {
        name: 'Regular Customer',
        email: 'user@gmail.com',
        password: 'user1234',
        role: 'user',
        latitude: 27.6850, // Somewhere near Lalitpur
        longitude: 85.3200,
      },
    ]);
    console.log('Seed users created: admin@gmail.com / user@gmail.com');

    // 3. Create Vehicles
    const vehicles = await Vehicle.create([
      {
        name: 'Tesla Model Y',
        type: 'EV',
        brand: 'Tesla',
        model: '2023 Long Range',
        fuelType: 'Electric',
        rentPerDay: 5000,
        fuelEfficiency: 24, // 24 km/kWh
        status: 'available',
        image: 'http://localhost:5000/uploads/vehicles/tesla_model_y.png'
      },
      {
        name: 'Nissan Leaf',
        type: 'EV',
        brand: 'Nissan',
        model: '2022 Tekna',
        fuelType: 'Electric',
        rentPerDay: 3500,
        fuelEfficiency: 18,
        status: 'available',
        image: 'http://localhost:5000/uploads/vehicles/nissan_leaf.png'
      },
      {
        name: 'Toyota Land Cruiser',
        type: 'SUV',
        brand: 'Toyota',
        model: 'LC300 VXR',
        fuelType: 'Diesel',
        rentPerDay: 9000,
        fuelEfficiency: 8, // 8 km/l (less efficient)
        status: 'available',
        image: 'http://localhost:5000/uploads/vehicles/land_cruiser.png'
      },
      {
        name: 'Hyundai Tucson',
        type: 'SUV',
        brand: 'Hyundai',
        model: '2021 Dynamic',
        fuelType: 'Petrol',
        rentPerDay: 6000,
        fuelEfficiency: 11,
        status: 'available',
        image: 'http://localhost:5000/uploads/vehicles/tucson.png'
      },
      {
        name: 'Suzuki Swift',
        type: 'Car',
        brand: 'Suzuki',
        model: '2022 VXi',
        fuelType: 'Petrol',
        rentPerDay: 2500,
        fuelEfficiency: 18,
        status: 'available',
        image: 'http://localhost:5000/uploads/vehicles/swift.png'
      },
      {
        name: 'Hyundai Grand i10',
        type: 'Car',
        brand: 'Hyundai',
        model: '2023 Magna',
        fuelType: 'Petrol',
        rentPerDay: 2200,
        fuelEfficiency: 16,
        status: 'available',
        image: 'http://localhost:5000/uploads/vehicles/i10.png'
      },
      {
        name: 'Yamaha FZ-S V3',
        type: 'Bike',
        brand: 'Yamaha',
        model: '150cc BS6',
        fuelType: 'Petrol',
        rentPerDay: 1200,
        fuelEfficiency: 45,
        status: 'available',
        image: 'http://localhost:5000/uploads/vehicles/fzs.png'
      },
      {
        name: 'Honda CRF 250 Rally',
        type: 'Bike',
        brand: 'Honda',
        model: '250cc Dirt',
        fuelType: 'Petrol',
        rentPerDay: 3000,
        fuelEfficiency: 28,
        status: 'available',
        image: 'http://localhost:5000/uploads/vehicles/crf.png'
      },
    ]);
    console.log(`Seed vehicles created: ${vehicles.length} vehicles.`);

    // 4. Create Rental Branches (Locations) with realistic Kathmandu coordinates
    const locations = await RentalLocation.create([
      {
        name: 'Kathmandu Central Branch',
        latitude: 27.7172,
        longitude: 85.3240,
        availableVehicles: [vehicles[0]._id, vehicles[4]._id, vehicles[6]._id], // Tesla, Swift, FZS
      },
      {
        name: 'Lalitpur Hub Station',
        latitude: 27.6710,
        longitude: 85.3120,
        availableVehicles: [vehicles[1]._id, vehicles[5]._id, vehicles[6]._id], // Nissan, i10, FZS
      },
      {
        name: 'Bhaktapur Historic Outlet',
        latitude: 27.6715,
        longitude: 85.4298,
        availableVehicles: [vehicles[2]._id, vehicles[7]._id], // Land Cruiser, Honda CRF
      },
      {
        name: 'Kirtipur Hill Branch',
        latitude: 27.6797,
        longitude: 85.2754,
        availableVehicles: [vehicles[3]._id, vehicles[4]._id], // Tucson, Swift
      },
      {
        name: 'Tribhuvan Airport Terminal',
        latitude: 27.6980,
        longitude: 85.3590,
        availableVehicles: [vehicles[0]._id, vehicles[2]._id, vehicles[5]._id], // Tesla, Land Cruiser, i10
      },
    ]);
    console.log(`Seed locations created: ${locations.length} branches.`);

    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
