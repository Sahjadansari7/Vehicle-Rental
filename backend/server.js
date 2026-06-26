const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Enable CORS with dynamic settings matching the CLIENT_URL
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded vehicle images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Root path response
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Vehicle Rental Booking System API',
    status: 'healthy',
  });
});

// Advanced central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
