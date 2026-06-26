# 🚗 Vehicle Rental Booking System

A full-stack MERN college project featuring a minimal black-and-white UI, Khalti payment integration, and two core algorithms.

---

## 📌 Overview

A simple Vehicle Rental Booking System built with the MERN stack. The focus is on a working vehicle rental flow, clean architecture, and two algorithm implementations:

- **Dijkstra's Algorithm** — nearest vehicle pickup location finder
- **Greedy Algorithm** — optimal vehicle allocation & pricing

---

## 🌍 Location Intelligence

The system integrates Haversine-based geolocation support:

- Each rental location and user stores `latitude` and `longitude`
- Distances are calculated using the **Haversine Formula**
- These distances are used as edge weights for Dijkstra's Algorithm
- Enables real-world GPS-based nearest rental location selection and vehicle routing

---

## 🎨 UI Design Rules

| Rule | Value |
|------|-------|
| Background | Pure Black |
| Text | White only |
| Borders | Gray only |
| Animations | None |
| Layout | Simple responsive |

No colors, gradients, or animations.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js + React Router + Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Styling | Tailwind CSS / Plain CSS |
| Payment | Khalti (Sandbox) |
| File Uploads | Multer |
| Currency | NRS |

---

## 📁 Folder Structure

```
vehicle-rental/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/               # Vehicle images stored here
│   │   └── vehicles/
│   └── utils/
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    └── index.html
```

---

## ⚙️ Environment Variables

### Backend — `.env`

```env
PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret
KHALTI_SECRET_KEY=your_khalti_secret_key
CLIENT_URL=http://localhost:5173
```

### Frontend — `.env`

```env
VITE_API_URL=http://localhost:5000
VITE_KHALTI_PUBLIC_KEY=your_khalti_public_key
```

---

## 🖼️ Image Uploads — Multer

Vehicle images are uploaded using **Multer**, stored in the `/uploads/vehicles/` folder on the server, and the file path (URL) is saved in the database.

### Installation

```bash
npm install multer
```

### Multer Config — `backend/config/multer.js`

```js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/vehicles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                  allowed.test(file.mimetype);
  isValid ? cb(null, true) : cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
```

### Serving Static Files — `backend/server.js`

```js
const express = require('express');
const path = require('path');
const app = express();

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

Images will be accessible at:
```
http://localhost:5000/uploads/vehicles/<filename>
```

### Vehicle Route with Upload — `backend/routes/vehicleRoutes.js`

```js
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { createVehicle, updateVehicle } = require('../controllers/vehicleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, upload.single('image'), createVehicle);
router.put('/:id', protect, adminOnly, upload.single('image'), updateVehicle);

module.exports = router;
```

### Vehicle Controller — `backend/controllers/vehicleController.js`

```js
const Vehicle = require('../models/Vehicle');

// POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const { name, type, brand, model, fuelType, rentPerDay } = req.body;

    // Build image URL from uploaded file path
    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/vehicles/${req.file.filename}`
      : null;

    const vehicle = await Vehicle.create({
      name,
      type,
      brand,
      model,
      fuelType,
      rentPerDay,
      image: imageUrl,
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `${req.protocol}://${req.get('host')}/uploads/vehicles/${req.file.filename}`;
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    res.json({ success: true, data: vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createVehicle, updateVehicle };
```

### Vehicle Model — `backend/models/Vehicle.js`

```js
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    type:       { type: String, enum: ['Bike', 'Car', 'SUV', 'EV'], required: true },
    brand:      { type: String, required: true },
    model:      { type: String, required: true },
    image:      { type: String, default: null },   // Stored as full URL
    fuelType:   { type: String, required: true },
    rentPerDay: { type: Number, required: true },
    status:     { type: String, enum: ['available', 'rented', 'maintenance'], default: 'available' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
```

### Frontend Upload — `AddVehicleForm.jsx`

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('name', name);
  formData.append('type', type);
  formData.append('brand', brand);
  formData.append('model', model);
  formData.append('fuelType', fuelType);
  formData.append('rentPerDay', rentPerDay);
  formData.append('image', imageFile); // File input

  await axios.post(`${import.meta.env.VITE_API_URL}/api/vehicles`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

### Displaying Vehicle Images

```jsx
<img
  src={vehicle.image || '/placeholder.png'}
  alt={vehicle.name}
  onError={(e) => { e.target.src = '/placeholder.png'; }}
/>
```

---

## 🗄️ Database Models

| Model | Key Fields |
|-------|-----------|
| **User** | auth, role, status |
| **Vehicle** | name, type, brand, model, `image` (URL), fuelType, rentPerDay, status |
| **RentalLocation** | name, location (coordinates), availableVehicles |
| **Booking** | user, vehicle, pickupLocation, pickupDate, returnDate, totalPrice, bookingStatus |
| **Payment** | booking, pidx, transactionId, status, amount |
| **Review** *(optional)* | user, vehicle, rating, comment |

---

## 🔐 Authentication

- Register / Login / Logout
- JWT-based protected routes
- Password hashing with bcrypt
- Roles: `user`, `admin`

---

## 👤 User Features

### 🚘 Vehicles

- Browse vehicle list
- Search by vehicle name or brand
- Filter by type (Bike, Car, SUV, EV)
- View vehicle details

### 📍 Pickup Locations

- Select nearest rental location
- View available vehicles
- Select pickup & return dates

### 📅 Booking

- Rent vehicles
- Prevent double booking
- Auto-generate Booking ID
- View booking history
- Cancel booking before pickup date

### 🧾 Booking Details

- Vehicle name
- Pickup location
- Pickup & return date
- Booking ID
- Total rental price (NRS)
- Payment status
- PDF invoice *(optional)*

---

## 💳 Payment System — Khalti

Uses the Khalti sandbox for payment processing.

### Payment Flow

```
Select Vehicle
  → Choose Pickup & Return Date
  → Calculate Rental Price
  → Create Booking Draft
  → Initiate Payment
  → Redirect to Khalti Checkout
  → User Pays
  → Receive pidx
  → Verify Payment (backend only)
  → Confirm Booking
```

### Khalti API

**Initiate Payment**
```
POST https://a.khalti.com/api/v2/epayment/initiate/
```

**Verify Payment**
```
POST https://a.khalti.com/api/v2/epayment/lookup/
```

---

## 🧠 Algorithms

### 1. Dijkstra's Algorithm — Nearest Rental Location Finder

- Each rental location stores GPS coordinates
- Distance between locations is calculated using **Haversine Formula**
- These distances are used as weights in a graph
- Dijkstra's Algorithm finds the shortest-distance rental location from the user's location
- Used on the pickup location selection page

**Use Case:** When a user searches for available vehicles, the system automatically suggests the nearest rental branch.

### 2. Greedy Algorithm — Optimal Vehicle Allocation & Pricing

- Filters available vehicles
- Sorts by lowest `rentPerDay`
- Prioritizes fuel-efficient vehicles
- Allocates best matching vehicle

**Pricing Rules:**

| Factor | Adjustment |
|--------|-----------|
| SUV / Premium Vehicle | Higher multiplier |
| Weekend Rental | +20% |
| Peak Season | +10% |
| Long-Term Rental (>7 days) | −15% discount |

**Formula:**

```
finalPrice = basePrice × vehicleTypeMultiplier × weekendMultiplier × seasonMultiplier − longTermDiscount
```

---

## 🔒 Security

- JWT on all protected routes
- Backend-only payment verification
- Input validation middleware
- No sensitive keys in frontend
- Prevent duplicate bookings

---

## ⚡ Extra Features

- Loading states
- Error handling
- Toast notifications
- Protected routes
- MVC architecture
- Reusable components
- Async/await usage
- Seed data
- Validation middleware

---

## 🚀 Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 📌 Project Scope

- Full working vehicle rental system
- Multer-based image upload (file on disk, URL in DB)
- Khalti payment integration
- Dijkstra + Greedy algorithms
- Clean MVC architecture
- Minimal black-and-white UI
- No over-engineering
