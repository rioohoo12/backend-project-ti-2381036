const { errorResponse } = require('../utils/apiResponse');

// Middleware ini HARUS dijalankan SETELAH authenticateToken
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User adalah admin, lanjutkan
  } else {
    return errorResponse(res, 'Forbidden: Admin access required', 403);
  }
};

module.exports = { isAdmin };