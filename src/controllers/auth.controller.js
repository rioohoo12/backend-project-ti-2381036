const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const userData = req.body;
    const user = await authService.register(userData);
    // Jangan kirim password hash ke client
    const { password, ...userWithoutPassword } = user;
    successResponse(res, 'User registered successfully', userWithoutPassword, 201);
  } catch (error) {
    next(error); // Teruskan error ke errorHandler middleware
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    successResponse(res, 'Login successful', result); // result berisi { user, token }
  } catch (error) {
    next(error); // Teruskan error ke errorHandler middleware
  }
};

// Tambahkan fungsi logout jika diperlukan (misal: blacklist token)

module.exports = {
  register,
  login,
};