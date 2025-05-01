const { Car, Booking, Sequelize } = require('../models'); // Import Sequelize jika butuh operator
const { Op } = Sequelize; // Operator Sequelize (e.g., Op.between)

const createCar = async (carData) => {
  try {
    const newCar = await Car.create(carData);
    return newCar;
  } catch (error) {
    console.error("Error in carService.createCar:", error.message);
    throw error;
  }
};

// Filter bisa berisi: make, model, status, minRate, maxRate, availableStartDate, availableEndDate
const getAllCars = async (filters = {}) => {
  try {
    const whereClause = {};
    if (filters.make) whereClause.make = filters.make;
    if (filters.model) whereClause.model = filters.model;
    if (filters.status) whereClause.status = filters.status;
    if (filters.minRate) whereClause.dailyRate = { ...whereClause.dailyRate, [Op.gte]: filters.minRate };
    if (filters.maxRate) whereClause.dailyRate = { ...whereClause.dailyRate, [Op.lte]: filters.maxRate };

    // Filter ketersediaan berdasarkan tanggal (lebih kompleks)
    if (filters.availableStartDate && filters.availableEndDate) {
      // Cari mobil yang TIDAK memiliki booking yang tumpang tindih dengan rentang tanggal yang diminta
      whereClause.id = {
        [Op.notIn]: Sequelize.literal(`(
          SELECT "carId"
          FROM "Bookings"
          WHERE
            (
              ("startDate" <= '${filters.availableEndDate}' AND "endDate" >= '${filters.availableStartDate}') OR
              ("startDate" >= '${filters.availableStartDate}' AND "startDate" <= '${filters.availableEndDate}') OR
              ("endDate" >= '${filters.availableStartDate}' AND "endDate" <= '${filters.availableEndDate}')
            ) AND "status" IN ('confirmed', 'pending') -- Hanya cek booking aktif
             AND "carId" IS NOT NULL
        )`)
      };
      // Juga pastikan status mobil bukan maintenance
      whereClause.status = { [Op.ne]: 'maintenance' };

    } else if (filters.status !== 'maintenance' && filters.status !== 'rented') {
      // Jika tidak ada filter tanggal, default tampilkan yg available
       whereClause.status = filters.status || 'available';
    }


    const cars = await Car.findAll({ where: whereClause });
    return cars;
  } catch (error) {
    console.error("Error in carService.getAllCars:", error.message);
    throw error;
  }
};

const getCarById = async (carId) => {
  try {
    const car = await Car.findByPk(carId);
    if (!car) {
      throw { statusCode: 404, message: 'Car not found', isOperational: true };
    }
    return car;
  } catch (error) {
    console.error("Error in carService.getCarById:", error.message);
    if (!error.isOperational) throw error;
     throw error;
  }
};

const updateCar = async (carId, updateData) => {
  try {
    const car = await Car.findByPk(carId);
    if (!car) {
      throw { statusCode: 404, message: 'Car not found', isOperational: true };
    }
    // Hapus field yang tidak boleh diupdate sembarangan jika perlu (misal ID)
    delete updateData.id;
    await car.update(updateData);
    return car;
  } catch (error) {
    console.error("Error in carService.updateCar:", error.message);
     if (!error.isOperational) throw error;
     throw error;
  }
};

const deleteCar = async (carId) => {
  try {
    const car = await Car.findByPk(carId);
    if (!car) {
      throw { statusCode: 404, message: 'Car not found', isOperational: true };
    }
    // Pertimbangkan soft delete atau cek booking aktif sebelum delete
    // await car.destroy(); // Hard delete

    // Cek apakah ada booking aktif
    const activeBooking = await Booking.findOne({
        where: {
            carId: carId,
            status: { [Op.in]: ['pending', 'confirmed'] },
            endDate: { [Op.gte]: new Date() } // Masih berjalan atau akan datang
        }
    });

    if (activeBooking) {
        throw { statusCode: 400, message: 'Cannot delete car with active or upcoming bookings.', isOperational: true };
    }

    await car.destroy(); // Hapus jika tidak ada booking aktif
    return { message: 'Car deleted successfully' };
  } catch (error) {
    console.error("Error in carService.deleteCar:", error.message);
     if (!error.isOperational) throw error;
     throw error;
  }
};

module.exports = {
  createCar,
  getAllCars,
  getCarById,
  updateCar,
  deleteCar,
};