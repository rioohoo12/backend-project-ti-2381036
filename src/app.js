require('dotenv').config(); // Muat variabel .env secepat mungkin
const express = require('express');
const cors = require('cors');
const { port, connectDB } = require('./config'); // Ambil port dan fungsi koneksi DB
const mainRouter = require('./routes'); // Import router utama
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

// Middleware الأساسية (Core Middlewares)
app.use(cors()); // Aktifkan CORS untuk semua origin (sesuaikan di production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Hubungkan ke Database
connectDB();

// Gunakan Router Utama
app.use(mainRouter); // Tidak perlu prefix /api/v1 lagi karena sudah di dalam router

// Middleware Penanganan Error (Harus ditaruh paling akhir setelah routes)
app.use(errorHandler);

// 404 Not Found Handler (jika request tidak cocok dengan route manapun)
app.use((req, res, next) => {
  res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}. Route not found.`
  });
});


// Jalankan Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection at: ${promise}, reason: ${err.message}`);
  console.error(err.stack);
  // Pertimbangkan untuk keluar dari proses secara graceful
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
   // Keluar dari proses (ini penting karena state aplikasi tidak terprediksi)
  process.exit(1);
});