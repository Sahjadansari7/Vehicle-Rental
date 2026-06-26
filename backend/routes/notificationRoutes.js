const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All notification routes require authentication

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/', clearAllNotifications);
router.delete('/:id', deleteNotification);

module.exports = router;
