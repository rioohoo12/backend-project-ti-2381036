const carService = require('../services/car.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const create = async (req, res, next) => {
  try {
    // Asumsi validasi sudah dilakukan oleh middleware
    const carData = req.body;
    const newCar = await carService.createCar(carData);
    successResponse(res, 'Car created successfully', newCar, 201);
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    // Ambil filter dari query params (req.query)
    const filters = req.query; // e.g., ?status=available&make=Toyota
    const cars = await carService.getAllCars(filters);
    successResponse(res, 'Cars retrieved successfully', cars);
  } catch (error) {
    next(error);
  }
};

const findOne = async (req, res, next) => {
  try {
    const carId = req.params.id;
    const car = await carService.getCarById(carId);
    successResponse(res, 'Car retrieved successfully', car);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const carId = req.params.id;
    const updateData = req.body;
    const updatedCar = await carService.updateCar(carId, updateData);
    successResponse(res, 'Car updated successfully', updatedCar);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const carId = req.params.id;
    const result = await carService.deleteCar(carId);
    successResponse(res, result.message); // atau 204 No Content
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  findAll,
  findOne,
  update,
  remove,
};