const userService = require('../services/user.service');

const { successResponse, errorResponse } = require('../utils/apiResponse');

// --- User Management (Contoh dipindah ke sini) ---
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    successResponse(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
   try {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);
    successResponse(res, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

const updateUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const updatedUser = await userService.updateUserById(userId, updateData);
    successResponse(res, 'User updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

const deleteUserById = async (req, res, next) => {
   try {
    const userId = req.params.id;
    const result = await userService.deleteUserById(userId);
    successResponse(res, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};

