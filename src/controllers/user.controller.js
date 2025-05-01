const userService = require('../services/user.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Mendapatkan profil pengguna yang sedang login
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Diambil dari middleware authenticateToken
    const userProfile = await userService.getUserProfile(userId);
    successResponse(res, 'Profile retrieved successfully', userProfile);
  } catch (error) {
    next(error);
  }
};

// Memperbarui profil pengguna yang sedang login
const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedUser = await userService.updateUserProfile(userId, updateData);
    successResponse(res, 'Profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

// --- Admin Only Controllers ---

// Mendapatkan semua pengguna (Admin)
const getAll = async (req, res, next) => {
  try {
    // Tambahkan logic untuk filter/pagination dari req.query jika diimplementasikan di service
    const users = await userService.getAllUsers(/* req.query */);
    successResponse(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

// Mendapatkan detail satu pengguna by ID (Admin)
const getOneById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);
    successResponse(res, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

// Memperbarui data pengguna by ID (Admin)
const updateOneById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const updatedUser = await userService.updateUserById(userId, updateData);
    successResponse(res, 'User updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

// Menghapus pengguna by ID (Admin)
const deleteOneById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const result = await userService.deleteUserById(userId);
    successResponse(res, result.message); // Mengirim pesan sukses
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMyProfile,
  updateMyProfile,
  // Admin
  getAll,
  getOneById,
  updateOneById,
  deleteOneById,
};