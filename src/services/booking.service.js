const { Booking, Car, User, Sequelize } = require('../models');
const { Op } = Sequelize;

// Helper untuk cek ketersediaan mobil
const checkCarAvailability = async (carId, startDate, endDate, excludeBookingId = null) => {
    const whereClause = {
        carId: carId,
        status: { [Op.in]: ['confirmed', 'pending'] }, // Cek booking yang relevan
        [Op.or]: [
            // Booking yang mulai sebelum dan selesai sesudah rentang
            { startDate: { [Op.lt]: endDate }, endDate: { [Op.gt]: startDate } },
            // Booking yang mulai di dalam rentang
            { startDate: { [Op.between]: [startDate, endDate] } },
            // Booking yang selesai di dalam rentang
            { endDate: { [Op.between]: [startDate, endDate] } }
        ]
    };
    // Jika sedang update booking, jangan cek booking itu sendiri
    if (excludeBookingId) {
        whereClause.id = { [Op.ne]: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne({ where: whereClause });
    return !conflictingBooking; // Return true jika available, false jika ada konflik
};


const createBooking = async (userId, carId, startDateStr, endDateStr) => {
  const transaction = await Sequelize.transaction(); // Gunakan transaksi
  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw { statusCode: 400, message: 'Invalid date format', isOperational: true };
    }
    if (endDate <= startDate) {
        throw { statusCode: 400, message: 'End date must be after start date', isOperational: true };
    }
    if (startDate < new Date()) {
         throw { statusCode: 400, message: 'Booking date cannot be in the past', isOperational: true };
    }

    const car = await Car.findByPk(carId, { transaction });
    if (!car) {
      throw { statusCode: 404, message: 'Car not found', isOperational: true };
    }
    if (car.status !== 'available') {
        // Cek ulang ketersediaan spesifik tanggal, karena status 'available' mungkin belum update
        const isAvailable = await checkCarAvailability(carId, startDate, endDate);
        if (!isAvailable) {
             throw { statusCode: 409, message: 'Car is not available for the selected dates', isOperational: true }; // 409 Conflict
        }
        // Jika available tapi status bukan 'available' (misal baru selesai disewa), ok lanjut
    } else {
         // Jika status 'available', tetap cek untuk double booking
        const isAvailable = await checkCarAvailability(carId, startDate, endDate);
        if (!isAvailable) {
             throw { statusCode: 409, message: 'Car is not available for the selected dates', isOperational: true }; // 409 Conflict
        }
    }


    // Hitung durasi (dalam hari, pembulatan ke atas)
    const durationMillis = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMillis / (1000 * 60 * 60 * 24));

    if (durationDays <= 0) {
        throw { statusCode: 400, message: 'Booking duration must be at least one day', isOperational: true };
    }

    const totalCost = durationDays * parseFloat(car.dailyRate);

    const newBooking = await Booking.create({
      userId,
      carId,
      startDate,
      endDate,
      totalCost,
      status: 'pending', // Awalnya pending, mungkin perlu konfirmasi admin/pembayaran
    }, { transaction });

    // (Opsional) Update status mobil menjadi 'rented' jika booking langsung 'confirmed'
    // if (newBooking.status === 'confirmed') {
    //     car.status = 'rented';
    //     await car.save({ transaction });
    // }

    await transaction.commit(); // Commit transaksi jika semua berhasil
    return newBooking;

  } catch (error) {
    await transaction.rollback(); // Rollback jika ada error
    console.error("Error in bookingService.createBooking:", error.message);
     if (!error.isOperational) throw error;
     throw error;
  }
};

const getUserBookings = async (userId) => {
  try {
    const bookings = await Booking.findAll({
        where: { userId },
        include: [{ model: Car, attributes: ['make', 'model', 'year', 'imageUrl'] }], // Sertakan detail mobil
        order: [['createdAt', 'DESC']] // Urutkan dari terbaru
    });
    return bookings;
  } catch (error) {
    console.error("Error in bookingService.getUserBookings:", error.message);
    throw error;
  }
};

const getAllBookings = async (filters = {}) => {
    // Admin only - get all bookings with filters (e.g., status, date range)
     try {
        const whereClause = {};
        if (filters.status) whereClause.status = filters.status;
        // Tambahkan filter lain jika perlu (userId, carId, date range)

        const bookings = await Booking.findAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: Car, attributes: ['id', 'make', 'model', 'licensePlate'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        return bookings;
    } catch (error) {
        console.error("Error in bookingService.getAllBookings:", error.message);
        throw error;
    }
}

const getBookingById = async (bookingId, userId = null, isAdmin = false) => {
  try {
    const includeOptions = [
        { model: Car, attributes: { exclude: ['createdAt', 'updatedAt'] } }, // Info mobil
        { model: User, attributes: ['id', 'name', 'email'] } // Info user pemesan
    ];
    const booking = await Booking.findByPk(bookingId, { include: includeOptions });

    if (!booking) {
      throw { statusCode: 404, message: 'Booking not found', isOperational: true };
    }

    // Jika bukan admin, pastikan user hanya bisa melihat booking miliknya
    if (!isAdmin && userId && booking.userId !== userId) {
         throw { statusCode: 403, message: 'Forbidden: You can only view your own bookings', isOperational: true };
    }

    return booking;
  } catch (error) {
    console.error("Error in bookingService.getBookingById:", error.message);
    if (!error.isOperational) throw error;
     throw error;
  }
};

const updateBookingStatus = async (bookingId, newStatus, adminId = null) => {
    // Hanya admin yang bisa confirm, complete atau admin/user bisa cancel?
     const transaction = await Sequelize.transaction();
    try {
        const booking = await Booking.findByPk(bookingId, { include: [Car], transaction });
        if (!booking) {
            throw { statusCode: 404, message: 'Booking not found', isOperational: true };
        }

        // Aturan perubahan status (sesuaikan kebutuhan)
        const allowedTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['completed', 'cancelled'], // Bisa complete atau cancel
            completed: [], // Tidak bisa diubah lagi
            cancelled: [], // Tidak bisa diubah lagi
        };

        if (!allowedTransitions[booking.status]?.includes(newStatus)) {
             throw { statusCode: 400, message: `Cannot change booking status from ${booking.status} to ${newStatus}`, isOperational: true };
        }

        // Logika tambahan, misal update status mobil
        if (newStatus === 'confirmed' && booking.Car) {
             // Cek lagi ketersediaan sebelum confirm? (Mungkin tidak perlu jika sudah dicek saat create)
             // Jika perlu update status mobil ke 'rented' saat confirm
             // booking.Car.status = 'rented';
             // await booking.Car.save({ transaction });
        } else if (newStatus === 'completed' && booking.Car) {
            // Jika selesai, kembalikan status mobil ke 'available'
            booking.Car.status = 'available';
            await booking.Car.save({ transaction });
        } else if (newStatus === 'cancelled' && booking.Car && booking.status === 'confirmed') {
             // Jika booking confirmed dibatalkan, kembalikan status mobil ke 'available'
             // Perlu cek apakah ada booking lain yang confirmed untuk mobil ini?
             const otherConfirmed = await Booking.findOne({
                 where: {
                     carId: booking.carId,
                     status: 'confirmed',
                     id: { [Op.ne]: booking.id }, // Bukan booking ini
                     // Cek apakah rentang waktunya relevan? (opsional)
                 },
                 transaction
             });
             // Jika tidak ada booking confirmed lain, set available
             if (!otherConfirmed) {
                 booking.Car.status = 'available';
                 await booking.Car.save({ transaction });
             }
        }


        booking.status = newStatus;
        await booking.save({ transaction });
        await transaction.commit();
        return booking;

    } catch(error) {
        await transaction.rollback();
        console.error("Error in bookingService.updateBookingStatus:", error.message);
        if (!error.isOperational) throw error;
        throw error;
    }
}

const cancelBooking = async (bookingId, userId) => {
  // User hanya bisa cancel booking miliknya yg statusnya 'pending' atau 'confirmed'
  const transaction = await Sequelize.transaction();
  try {
    const booking = await Booking.findOne({
        where: { id: bookingId, userId: userId },
        include: [Car], // Include Car untuk update statusnya
        transaction
    });

    if (!booking) {
      throw { statusCode: 404, message: 'Booking not found or you do not have permission to cancel it', isOperational: true };
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw { statusCode: 400, message: `Cannot cancel booking with status: ${booking.status}`, isOperational: true };
    }

    const originalStatus = booking.status;
    booking.status = 'cancelled';
    await booking.save({ transaction });

    // Jika mobil ada dan booking sebelumnya confirmed, coba set mobil jadi available
    if (booking.Car && originalStatus === 'confirmed') {
        const otherConfirmed = await Booking.findOne({
            where: {
                carId: booking.carId,
                status: 'confirmed',
                id: { [Op.ne]: booking.id },
            },
            transaction
        });
        if (!otherConfirmed) {
            booking.Car.status = 'available';
            await booking.Car.save({ transaction });
        }
    }

    await transaction.commit();
    return { message: 'Booking cancelled successfully' };

  } catch (error) {
    await transaction.rollback();
    console.error("Error in bookingService.cancelBooking:", error.message);
    if (!error.isOperational) throw error;
     throw error;
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings, // For admin
  updateBookingStatus, // For admin
};