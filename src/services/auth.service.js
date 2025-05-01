const { User } = require('../models');
const { comparePassword } = require('../utils/passwordHasher');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config');

const register = async (userData) => {
  try {
    // Validasi dasar (lebih baik pakai middleware Joi)
    if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Name, email, and password are required');
    }
    // Role default 'user' jika tidak disediakan atau tidak valid
    if (!['user', 'admin'].includes(userData.role)) {
        userData.role = 'user';
    }

    // Model hook akan otomatis hash password
    const newUser = await User.create(userData);
    // Jangan kirim password kembali
    const userJson = newUser.toJSON();
    delete userJson.password;
    return userJson;
  } catch (error) {
    // Tangani error unique constraint atau validasi dari model
    // Error akan ditangkap oleh controller dan diteruskan ke errorHandler
    console.error("Error in authService.register:", error.message);
    throw error; // Lempar ulang error agar ditangani di lapisan atas
  }
};

const login = async (email, password) => {
  try {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Email and password are required', isOperational: true };
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials', isOperational: true }; // Email tidak ditemukan
    }

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid credentials', isOperational: true }; // Password salah
    }

    // Buat token JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

    // Jangan kirim password
    const userJson = user.toJSON();
    delete userJson.password;

    return { user: userJson, token };

  } catch (error) {
    console.error("Error in authService.login:", error.message);
    // Jika bukan error operasional, lempar error asli
    if (!error.isOperational) throw error;
    // Jika error operasional (dibuat di atas), lempar itu
    throw error;
  }
};

module.exports = {
  register,
  login,
};