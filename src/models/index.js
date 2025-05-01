const { sequelize } = require('../config');
const User = require('./User.model');
const Car = require('./Car.model');
const Booking = require('./Booking.model');
const Token = require('./Token.model'); // Jika menggunakan Token model

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Masukkan semua model ke object db
db.User = User;
db.Car = Car;
db.Booking = Booking;
db.Token = Token; // Jika menggunakan Token model

// Definisikan Relasi / Asosiasi antar model
// User -> Booking (Satu User bisa punya banyak Booking)
db.User.hasMany(db.Booking, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Booking.belongsTo(db.User, { foreignKey: 'userId' });

// Car -> Booking (Satu Mobil bisa punya banyak Booking)
db.Car.hasMany(db.Booking, { foreignKey: 'carId', onDelete: 'SET NULL' }); // Jika mobil dihapus, booking tidak ikut hilang
db.Booking.belongsTo(db.Car, { foreignKey: 'carId' });

// User -> Token (Satu User bisa punya banyak Token - misal refresh token)
// db.User.hasMany(db.Token, { foreignKey: 'userId', onDelete: 'CASCADE' });
// db.Token.belongsTo(db.User, { foreignKey: 'userId' });


module.exports = db; // Ekspor object db yang berisi instance sequelize dan semua model