const express = require('express');
const carController = require('../controllers/car.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');
// const validateRequest = require('../middleware/validate.middleware');
// const Joi = require('joi');

const router = express.Router();


// Rute Publik (tidak perlu login)
router.get('/', carController.findAll); // Cari semua mobil (bisa tambah filter query)
router.get('/:id', /* validateRequest(paramIdSchema), */ carController.findOne); // Detail satu mobil

// Rute yang Membutuhkan Admin Role
router.post('/', authenticateToken, isAdmin, /* validateRequest(carSchema), */ carController.create);
router.put('/:id', authenticateToken, isAdmin, /* validateRequest(paramIdSchema), validateRequest(carUpdateSchema), */ carController.update);
router.delete('/:id', authenticateToken, isAdmin, /* validateRequest(paramIdSchema), */ carController.remove);

module.exports = router;