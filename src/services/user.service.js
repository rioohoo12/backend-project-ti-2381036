const { User, Booking, Sequelize } = require('../models'); // Import model User dan Booking
const { Op } = Sequelize; // Import operator Sequelize jika diperlukan

// Mendapatkan profil pengguna yang sedang login
const getUserProfile = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }, // Jangan kirim password dan timestamp detail
    });
    if (!user) {
      throw { statusCode: 404, message: 'User not found', isOperational: true };
    }
    return user;
  } catch (error) {
    console.error("Error in userService.getUserProfile:", error.message);
    if (!error.isOperational) throw error;
    throw error;
  }
};

// Memperbarui profil pengguna yang sedang login
const updateUserProfile = async (userId, updateData) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found', isOperational: true };
    }

    // Filter field yang boleh diupdate oleh user sendiri (misal: nama, email, password)
    // Jangan biarkan user mengubah 'role' atau 'id'
    const allowedUpdates = ['name', 'email', 'password'];
    const finalUpdateData = {};
    for (const key of allowedUpdates) {
        if (updateData.hasOwnProperty(key)) {
            // Jika password diupdate, model hook akan otomatis hash
            finalUpdateData[key] = updateData[key];
        }
    }

    // Cek jika email diubah dan sudah ada yang pakai (kecuali user itu sendiri)
    if (finalUpdateData.email && finalUpdateData.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: finalUpdateData.email } });
        if (existingUser) {
            throw { statusCode: 409, message: 'Email already in use', isOperational: true };
        }
    }

    // Jika tidak ada data valid untuk diupdate
    if (Object.keys(finalUpdateData).length === 0) {
        throw { statusCode: 400, message: 'No valid fields provided for update', isOperational: true };
    }


    await user.update(finalUpdateData);

    // Ambil data user yang sudah diupdate (tanpa password)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });
    return updatedUser;

  } catch (error) {
    console.error("Error in userService.updateUserProfile:", error.message);
    // Tangani error Sequelize (misal unique constraint jika email sudah ada)
    if (error.name === 'SequelizeUniqueConstraintError') {
         throw { statusCode: 409, message: 'Email already in use', isOperational: true };
    }
    if (!error.isOperational) throw error; // Lempar error operasional
    throw error; // Lempar error lain
  }
};


// --- Admin Operations ---

// Mendapatkan semua pengguna (dengan filter & pagination jika perlu)
const getAllUsers = async (/* filters, paginationOptions */) => {
  try {
    // Implementasi filter dan pagination di sini jika diperlukan
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Selalu exclude password
      order: [['createdAt', 'DESC']],
      // where: filters,
      // limit: paginationOptions.limit,
      // offset: paginationOptions.offset
    });
    return users;
  } catch (error) {
    console.error("Error in userService.getAllUsers:", error.message);
    throw error;
  }
};

// Mendapatkan detail satu pengguna berdasarkan ID (oleh admin)
const getUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      throw { statusCode: 404, message: 'User not found', isOperational: true };
    }
    return user;
  } catch (error) {
    console.error("Error in userService.getUserById:", error.message);
    if (!error.isOperational) throw error;
    throw error;
  }
};

// Memperbarui data pengguna berdasarkan ID (oleh admin)
const updateUserById = async (userId, updateData) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found', isOperational: true };
    }

    // Admin mungkin bisa mengubah lebih banyak field, termasuk 'role'
    // Hapus field yang tidak boleh diubah (misal: id)
    delete updateData.id;
    delete updateData.password; // Admin tidak boleh set password langsung, mungkin ada flow reset

     // Cek jika email diubah dan sudah ada yang pakai (kecuali user itu sendiri)
    if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: updateData.email } });
        if (existingUser) {
            throw { statusCode: 409, message: 'Email already in use', isOperational: true };
        }
    }

     if (Object.keys(updateData).length === 0) {
        throw { statusCode: 400, message: 'No fields provided for update', isOperational: true };
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });
    return updatedUser;
  } catch (error) {
    console.error("Error in userService.updateUserById:", error.message);
     if (error.name === 'SequelizeUniqueConstraintError') {
         throw { statusCode: 409, message: 'Email already in use', isOperational: true };
    }
    if (!error.isOperational) throw error;
    throw error;
  }
};

// Menghapus pengguna berdasarkan ID (oleh admin)
const deleteUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found', isOperational: true };
    }

    // Optional: Cek apakah user punya booking aktif sebelum menghapus
    const activeBooking = await Booking.findOne({
        where: {
            userId: userId,
            status: { [Op.in]: ['pending', 'confirmed'] },
            // endDate: { [Op.gte]: new Date() } // Cek jika booking sedang berjalan/akan datang
        }
    });

    if (activeBooking) {
        throw { statusCode: 400, message: 'Cannot delete user with active or upcoming bookings. Please resolve bookings first.', isOperational: true };
    }

    // Pertimbangkan Soft Delete jika diperlukan daripada hard delete
    await user.destroy(); // Hard delete
    return { message: 'User deleted successfully' };

  } catch (error) {
    console.error("Error in userService.deleteUserById:", error.message);
    if (!error.isOperational) throw error;
    throw error;
  }
};


module.exports = {
  getUserProfile,
  updateUserProfile,
  // Admin
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};