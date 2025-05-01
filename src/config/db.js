const { Sequelize } = require('sequelize');
require('dotenv').config(); // Pastikan variabel env dimuat

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres', // atau 'mysql'
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log query di development
  // Tambahkan opsi lain jika perlu (pool, ssl, etc.)
  // dialectOptions: {
  //   ssl: {
  //     require: true,
  //     rejectUnauthorized: false // Perlu jika DB di cloud dan tidak ada CA cert lokal
  //   }
  // }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    // Sinkronisasi model (hati-hati di production, bisa pakai migration)
    // await sequelize.sync({ alter: true }); // 'alter: true' mencoba mengubah tabel agar sesuai model
    // console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // Keluar jika koneksi DB gagal
  }
};

module.exports = { sequelize, connectDB };