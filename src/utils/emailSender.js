const nodemailer = require('nodemailer');
require('dotenv').config(); // Pastikan variabel env dimuat

// Konfigurasi transporter Nodemailer
// Ambil konfigurasi dari environment variables (.env)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, // e.g., 'smtp.gmail.com' or your SMTP provider
  port: parseInt(process.env.MAIL_PORT || '587', 10), // e.g., 587 for TLS, 465 for SSL
  secure: parseInt(process.env.MAIL_PORT || '587', 10) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER, // Your email address
    pass: process.env.MAIL_PASS, // Your email password or app password
  },
  // (Opsional) Tambahkan opsi TLS jika diperlukan oleh provider Anda
  // tls: {
  //   ciphers:'SSLv3'
  // }
});

// Verifikasi koneksi transporter saat development (opsional)
if (process.env.NODE_ENV === 'development') {
    transporter.verify(function(error, success) {
        if (error) {
            console.error('Email transporter verification failed:', error);
        } else {
            console.log('Email transporter is ready to send messages');
        }
    });
}


/**
 * Mengirim email.
 * @param {string} to - Alamat email penerima.
 * @param {string} subject - Judul email.
 * @param {string} text - Konten email versi teks polos.
 * @param {string} [html] - Konten email versi HTML (opsional).
 * @returns {Promise<object>} - Promise yang resolve dengan info pengiriman atau reject dengan error.
 */
const sendEmail = async (to, subject, text, html = null) => {
  // Default 'from' address, bisa juga dari .env
  const fromAddress = process.env.MAIL_FROM || `"Rental Mobil App" <${process.env.MAIL_USER}>`;

  const mailOptions = {
    from: fromAddress,
    to: to, // Bisa string tunggal atau array/comma-separated string untuk multiple recipients
    subject: subject,
    text: text, // Konten teks polos
    html: html || text, // Konten HTML, fallback ke teks jika tidak ada
  };

  try {
    console.log(`Attempting to send email to ${to} with subject "${subject}"`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Hanya jika menggunakan Ethereal
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw new Error(`Failed to send email. ${error.message}`); // Lempar error agar bisa ditangani di service
  }
};

module.exports = {
  sendEmail,
};

// Jangan lupa tambahkan variabel berikut ke file .env Anda:
/*
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password_or_app_password
MAIL_FROM="Nama Aplikasi Anda" <your_email@example.com> // Opsional, jika beda dengan MAIL_USER
*/