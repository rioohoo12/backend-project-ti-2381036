const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Foreign keys akan didefinisikan di index.js models
  // userId: ...,
  // carId: ...,
  startDate: { // Tanggal mulai sewa
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: { // Tanggal selesai sewa
    type: DataTypes.DATE,
    allowNull: false,
  },
  totalCost: { // Total biaya sewa
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  status: { // Status pemesanan
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
  },
}, {
  timestamps: true,
  validate: {
    // Pastikan tanggal selesai setelah tanggal mulai
    endDateAfterStartDate() {
      if (this.startDate && this.endDate && this.endDate <= this.startDate) {
        throw new Error('End date must be after start date.');
      }
    }
  }
});

module.exports = Booking;