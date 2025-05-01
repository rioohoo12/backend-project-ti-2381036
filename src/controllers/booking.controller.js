const bookingService = require('../services/booking.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const create = async (req, res, next) => {
  try {
    const userId = req.user.id; // Ambil userId dari user yang terotentikasi
    const { carId, startDate, endDate } = req.body;
    const newBooking = await bookingService.createBooking(userId, carId, startDate, endDate);
    successResponse(res, 'Booking created successfully', newBooking, 201);
  } catch (error) {
    next(error);
  }
};

// Mendapatkan semua booking milik user yang login
const findMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookings = await bookingService.getUserBookings(userId);
    successResponse(res, 'Your bookings retrieved successfully', bookings);
  } catch (error) {
    next(error);
  }
};

// Mendapatkan detail satu booking (bisa milik sendiri atau admin lihat)
const findOne = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const booking = await bookingService.getBookingById(bookingId, userId, isAdmin);
    successResponse(res, 'Booking retrieved successfully', booking);
  } catch (error) {
    next(error);
  }
};

// Membatalkan booking (hanya user pemilik)
const cancel = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const result = await bookingService.cancelBooking(bookingId, userId);
    successResponse(res, result.message);
  } catch (error) {
    next(error);
  }
};

// --- Admin Only ---
const findAll = async(req, res, next) => {
    // Hanya admin
     try {
        const filters = req.query;
        const bookings = await bookingService.getAllBookings(filters);
        successResponse(res, 'All bookings retrieved successfully', bookings);
    } catch (error) {
        next(error);
    }
}

const updateStatus = async(req, res, next) => {
    // Hanya admin
    try {
        const bookingId = req.params.id;
        const { status } = req.body;
        if (!status) {
            return errorResponse(res, 'New status is required', 400);
        }
        const updatedBooking = await bookingService.updateBookingStatus(bookingId, status, req.user.id);
         successResponse(res, 'Booking status updated successfully', updatedBooking);
    } catch (error) {
        next(error);
    }
}


module.exports = {
  create,
  findMyBookings,
  findOne,
  cancel,
  // Admin
  findAll,
  updateStatus,
};