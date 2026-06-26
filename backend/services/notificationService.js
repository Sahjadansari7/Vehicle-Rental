const Notification = require('../models/Notification');

/**
 * Creates a notification for a specific user.
 * @param {Object} params
 * @param {string} params.userId       - Target user's _id
 * @param {string} params.title        - Short notification title
 * @param {string} params.message      - Descriptive message body
 * @param {string} params.type         - Notification type enum
 * @param {string} [params.bookingId]  - Optional related booking _id
 * @param {string} [params.vehicleId]  - Optional related vehicle _id
 */
const createNotification = async ({ userId, title, message, type, bookingId = null, vehicleId = null }) => {
  try {
    const notif = await Notification.create({
      user: userId,
      title,
      message,
      type,
      relatedBooking: bookingId,
      relatedVehicle: vehicleId,
    });
    return notif;
  } catch (err) {
    // Never let notification failure break the main flow
    console.error('[NotificationService] Failed to create notification:', err.message);
  }
};

module.exports = { createNotification };
