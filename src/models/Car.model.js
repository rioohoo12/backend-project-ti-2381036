const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  make: { // Merek (e.g., Toyota, Honda)
    type: DataTypes.STRING,
    allowNull: false,
  },
  model: { // Model (e.g., Avanza, Civic)
    type: DataTypes.STRING,
    allowNull: false,
  },
  year: { // Tahun pembuatan
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  licensePlate: { // Nomor Polisi
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  dailyRate: { // Harga sewa per hari
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: { // Status ketersediaan
    type: DataTypes.ENUM('available', 'rented', 'maintenance'),
    defaultValue: 'available',
    allowNull: false,
  },
  imageUrl: { // URL gambar mobil
    type: DataTypes.STRING,
    allowNull: true, // Bisa jadi opsional
  },
}, {
  timestamps: true,
});

module.exports = Car;