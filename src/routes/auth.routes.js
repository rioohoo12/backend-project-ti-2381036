const express = require('express');
const authController = require('../controllers/auth.controller');
// const validateRequest = require('../middleware/validate.middleware'); // Jika pakai validasi Joi
// const Joi = require('joi'); // Jika pakai Joi

const router = express.Router();


router.post('/register',  authController.register);
router.post('/login',  authController.login);
// Tambahkan route logout jika perlu

module.exports = router;