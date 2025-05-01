const express = require('express');
const authRoutes = require('./auth.routes');
const carRoutes = require('./car.routes');
const bookingRoutes = require('./booking.routes');
// const adminRoutes = require('./admin.routes'); // Jika ada rute khusus admin terpisah

const router = express.Router();

const API_PREFIX = '/api/v1'; // Prefix untuk semua API

router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/cars`, carRoutes);
router.use(`${API_PREFIX}/bookings`, bookingRoutes);
// router.use(`${API_PREFIX}/admin`, adminRoutes); // Jika ada

// Default route untuk cek API status
router.get('/', (req, res) => {
    res.json({ message: 'Welcome to Rental Mobil API v1' });
});
router.get(API_PREFIX, (req, res) => {
    res.json({ message: 'Rental Mobil API v1 is running' });
});


module.exports = router;