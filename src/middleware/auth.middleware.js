const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { User } = require('../models'); // Import dari models/index.js
const { errorResponse } = require('../utils/apiResponse');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return errorResponse(res, 'Authentication token required', 401);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    // Optional: Cek apakah user masih ada di database
    const user = await User.findByPk(decoded.id, { attributes: ['id', 'email', 'role'] });
    if (!user) {
      return errorResponse(res, 'User not found', 401);
    }

    req.user = user; // Simpan data user (tanpa password) di request
    next(); // Lanjut ke middleware/controller berikutnya
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
       return errorResponse(res, 'Token expired', 401);
    }
    if (err instanceof jwt.JsonWebTokenError) {
        return errorResponse(res, 'Invalid token', 403);
    }
    // Tangani error lain jika perlu
    return errorResponse(res, 'Authentication failed', 403);
  }
};

module.exports = { authenticateToken };