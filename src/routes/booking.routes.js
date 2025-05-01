const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');
// const validateRequest = require('../middleware/validate.middleware');
// const Joi = require('joi');

const router = express.Router();


// Rute yang Membutuhkan Login User
router.post('/', authenticateToken, /* validateRequest(createBookingSchema), */ bookingController.create);
router.get('/my-bookings', authenticateToken, bookingController.findMyBookings); // Ganti nama endpoint
router.get('/:id', authenticateToken, /* validateRequest(paramIdSchema), */ bookingController.findOne); // User bisa lihat detail bookingnya sendiri (controller handle permission)
router.patch('/:id/cancel', authenticateToken, /* validateRequest(paramIdSchema), */ bookingController.cancel); // User cancel bookingnya

// --- Rute Khusus Admin ---
// Perlu authenticateToken dan isAdmin
router.get('/', authenticateToken, isAdmin, bookingController.findAll); // Admin lihat semua booking
router.patch('/:id/status', authenticateToken, isAdmin, /* validateRequest(paramIdSchema), validateRequest(updateStatusSchema), */ bookingController.updateStatus); // Admin update status

module.exports = router;