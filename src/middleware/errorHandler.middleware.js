const { errorResponse } = require('../utils/apiResponse');
const { BaseError } = require('sequelize'); // Untuk error spesifik Sequelize

const errorHandler = (err, req, res, next) => {
  console.error("ERROR LOG:", new Date().toISOString());
  console.error("Request Path:", req.path);
  console.error("Error:", err); // Log error lengkap ke console server

  // Handle error Sequelize spesifik
  if (err instanceof BaseError) {
    // Contoh: Error validasi Sequelize
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return errorResponse(res, 'Validation failed', 400, messages);
    }
    // Contoh: Error unique constraint
    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = Object.keys(err.fields)[0];
        return errorResponse(res, `${field} already exists`, 409); // 409 Conflict
    }
    // Tambahkan penanganan error Sequelize lain jika perlu
    return errorResponse(res, 'Database error occurred', 500);
  }

  // Handle error custom (jika Anda membuatnya)
  if (err.isOperational) { // Jika error punya flag 'isOperational'
      return errorResponse(res, err.message, err.statusCode);
  }

  // Handle error umum atau tidak terduga
  // Jangan ekspos detail error internal ke client di production
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode);
};

module.exports = errorHandler;