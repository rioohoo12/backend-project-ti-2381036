const winston = require('winston');
const path = require('path');
require('dotenv').config();

const logDirectory = path.join(__dirname, '../../logs'); // Buat folder 'logs' di root proyek

// Tentukan level logging (error, warn, info, http, verbose, debug, silly)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3, // Level khusus untuk log request HTTP
  debug: 4,
};

// Tentukan level berdasarkan environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn'; // Lebih detail di dev, ringkas di prod
};

// Warna untuk level logging (opsional, untuk console)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Format log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // winston.format.colorize({ all: true }), // Aktifkan jika ingin warna di console
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }), // Warna khusus untuk console
  logFormat // Gunakan format dasar yang sama
);


// Tentukan transport (output log)
const transports = [
  // Selalu tampilkan di console
  new winston.transports.Console({
      format: consoleFormat, // Format dengan warna untuk console
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info', // Tampilkan lebih banyak di dev console
  }),

  // Simpan log error ke file terpisah
  new winston.transports.File({
    filename: path.join(logDirectory, 'error.log'),
    level: 'error', // Hanya log level error ke file ini
    format: winston.format.combine(
        logFormat, // Format standar tanpa warna
        winston.format.json() // Simpan sebagai JSON agar mudah diparsing
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5, // Simpan hingga 5 file log error lama
  }),

  // Simpan semua log (sesuai level utama) ke file lain
  new winston.transports.File({
    filename: path.join(logDirectory, 'app.log'),
    format: winston.format.combine(
        logFormat,
        winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Buat instance logger
const logger = winston.createLogger({
  level: level(), // Level logging utama
  levels,
  format: logFormat, // Format default jika transport tidak menimpanya
  transports,
  exitOnError: false, // Jangan keluar dari aplikasi jika ada error saat logging
});

module.exports = logger;
