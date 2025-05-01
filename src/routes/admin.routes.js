const express = require('express');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');

// Import controller yang memiliki fungsi admin
const userController = require('../controllers/user.controller');
const carController = require('../controllers/car.controller');
const bookingController = require('../controllers/booking.controller');
// Import controller lain jika ada fungsi admin di sana

// (Opsional) Import admin.controller.js jika Anda memindahkan semua fungsi admin ke sana
// const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Middleware ini akan diterapkan ke SEMUA rute dalam file ini
router.use(authenticateToken);
router.use(isAdmin);

// --- User Management Routes (Admin Only) ---
router.get('/users', userController.getAll); // GET /api/v1/admin/users
router.get('/users/:id', userController.getOneById); // GET /api/v1/admin/users/:id
router.put('/users/:id', userController.updateOneById); // PUT /api/v1/admin/users/:id
router.delete('/users/:id', userController.deleteOneById); // DELETE /api/v1/admin/users/:id

// --- Car Management Routes (Admin Only - CRUD) ---
// GET cars biasanya publik, jadi hanya POST, PUT, DELETE yang perlu di sini
router.post('/cars', carController.create); // POST /api/v1/admin/cars
router.put('/cars/:id', carController.update); // PUT /api/v1/admin/cars/:id
router.delete('/cars/:id', carController.remove); // DELETE /api/v1/admin/cars/:id

// --- Booking Management Routes (Admin Only) ---
router.get('/bookings', bookingController.findAll); // GET /api/v1/admin/bookings (get all bookings)
router.patch('/bookings/:id/status', bookingController.updateStatus); // PATCH /api/v1/admin/bookings/:id/status

// --- (Opsional) Rute jika menggunakan adminController terpisah ---
// Misal untuk dashboard stats:
// router.get('/dashboard/stats', adminController.getDashboardStats);

module.exports = router;

// !!! PENTING !!!
// Jangan lupa daftarkan router ini di src/routes/index.js:
/*
// src/routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const carRoutes = require('./car.routes');
const bookingRoutes = require('./booking.routes');
const userRoutes = require('./user.routes'); // Tambahkan ini jika belum
const adminRoutes = require('./admin.routes'); // Import admin routes

const router = express.Router();
const API_PREFIX = '/api/v1';

router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/cars`, carRoutes); // Rute publik/user untuk mobil
router.use(`${API_PREFIX}/bookings`, bookingRoutes); // Rute user untuk booking
router.use(`${API_PREFIX}/users`, userRoutes); // Rute user untuk profilnya
router.use(`${API_PREFIX}/admin`, adminRoutes); // Prefix untuk semua rute admin

// ... (rest of the file)
*/

// Anda juga perlu membuat src/routes/user.routes.js untuk endpoint profil user
/*
// src/routes/user.routes.js
const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = express.Router();

// Middleware otentikasi untuk semua rute profil
router.use(authenticateToken);

router.get('/profile/me', userController.getMyProfile); // GET /api/v1/users/profile/me
router.put('/profile/me', userController.updateMyProfile); // PUT /api/v1/users/profile/me

module.exports = router;
*/