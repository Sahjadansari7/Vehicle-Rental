const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getOptimalRecommendation,
} = require('../controllers/vehicleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getVehicles);
router.get('/recommend/optimal', getOptimalRecommendation);
router.get('/:id', getVehicleById);

// Admin-only routes with Multer upload
router.post('/', protect, adminOnly, upload.single('image'), createVehicle);
router.put('/:id', protect, adminOnly, upload.single('image'), updateVehicle);
router.delete('/:id', protect, adminOnly, deleteVehicle);

module.exports = router;
