const cron = require('node-cron');
const logger = require('../utils/logger'); // Gunakan logger yang sudah dibuat
const { Booking, Car, Sequelize } = require('../models'); // Import model dan Sequelize jika perlu
const { Op } = Sequelize;
const { sendEmail } = require('../utils/emailSender'); // Import email sender jika job mengirim email

logger.info('Initializing background job scheduler...');

// --- Contoh Job 1: Update status mobil yang sewanya sudah selesai ---
// Jalankan setiap jam ('0 * * * *')
cron.schedule('0 * * * *', async () => {
    logger.info('[JOB] Running job: Check for completed bookings and update car status');
    const transaction = await sequelize.transaction(); // Gunakan transaksi
    try {
        const now = new Date();
        // Cari booking yang statusnya 'confirmed' dan tanggal selesainya sudah lewat
        const completedBookings = await Booking.findAll({
            where: {
                status: 'confirmed',
                endDate: { [Op.lt]: now } // endDate lebih kecil dari waktu sekarang
            },
            include: [Car], // Sertakan mobil untuk update statusnya
            transaction
        });

        if (completedBookings.length === 0) {
            logger.info('[JOB] No confirmed bookings found past their end date.');
            await transaction.commit(); // Commit meskipun tidak ada perubahan
            return;
        }

        logger.info(`[JOB] Found ${completedBookings.length} completed bookings to process.`);

        for (const booking of completedBookings) {
            // Update status booking menjadi 'completed'
            booking.status = 'completed';
            await booking.save({ transaction });
            logger.info(`[JOB] Updated booking ${booking.id} status to completed.`);

            // Jika mobil terkait masih berstatus 'rented', kembalikan ke 'available'
            // Perlu cek lagi apakah ada booking lain yang masih aktif untuk mobil ini? (jarang terjadi jika logic benar)
            if (booking.Car && booking.Car.status === 'rented') {
                 // Cek cepat jika ada booking lain yang confirmed/pending untuk mobil ini
                 const otherActiveBooking = await Booking.findOne({
                     where: {
                         carId: booking.carId,
                         id: { [Op.ne]: booking.id },
                         status: { [Op.in]: ['confirmed', 'pending'] },
                         // Cek jika rentang waktunya masih relevan? (Opsional)
                     },
                     transaction
                 });

                 if (!otherActiveBooking) {
                     booking.Car.status = 'available';
                     await booking.Car.save({ transaction });
                     logger.info(`[JOB] Updated car ${booking.carId} status to available.`);
                 } else {
                     logger.info(`[JOB] Car ${booking.carId} still has other active bookings, status remains rented.`);
                 }
            }
        }

        await transaction.commit(); // Commit semua perubahan
        logger.info('[JOB] Finished processing completed bookings.');

    } catch (error) {
        await transaction.rollback(); // Rollback jika ada error
        logger.error('[JOB] Error checking completed bookings:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Jakarta" // Atur timezone sesuai lokasi server/target audiens
});


// --- Contoh Job 2: Kirim reminder H-1 pengembalian ---
// Jalankan setiap hari jam 8 pagi ('0 8 * * *')
cron.schedule('0 8 * * *', async () => {
    logger.info('[JOB] Running job: Send return reminders');
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
        const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

        // Cari booking yang 'confirmed' dan akan berakhir besok
        const bookingsToRemind = await Booking.findAll({
            where: {
                status: 'confirmed',
                endDate: {
                    [Op.between]: [startOfTomorrow, endOfTomorrow]
                }
            },
            include: [
                { model: User, attributes: ['email', 'name'] }, // Ambil email & nama user
                { model: Car, attributes: ['make', 'model'] } // Ambil info mobil
            ]
        });

         if (bookingsToRemind.length === 0) {
            logger.info('[JOB] No bookings ending tomorrow found for reminders.');
            return;
        }

        logger.info(`[JOB] Found ${bookingsToRemind.length} bookings ending tomorrow. Sending reminders...`);

        for (const booking of bookingsToRemind) {
            if (!booking.User || !booking.User.email) {
                logger.warn(`[JOB] Skipping reminder for booking ${booking.id}, user email not found.`);
                continue;
            }
            const subject = `Pengingat Pengembalian Mobil Rental - ${booking.Car.make} ${booking.Car.model}`;
            const textBody = `Halo ${booking.User.name},\n\nIni adalah pengingat bahwa masa sewa mobil ${booking.Car.make} ${booking.Car.model} Anda akan berakhir besok, ${booking.endDate.toLocaleDateString('id-ID')}.\n\nMohon persiapkan pengembalian mobil tepat waktu.\n\nTerima kasih,\nRental Mobil App`;
            // Anda bisa membuat template HTML yang lebih bagus
            const htmlBody = `<p>Halo ${booking.User.name},</p><p>Ini adalah pengingat bahwa masa sewa mobil <strong>${booking.Car.make} ${booking.Car.model}</strong> Anda akan berakhir besok, <strong>${booking.endDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p><p>Mohon persiapkan pengembalian mobil tepat waktu.</p><p>Terima kasih,<br/><strong>Rental Mobil App</strong></p>`;

            try {
                await sendEmail(booking.User.email, subject, textBody, htmlBody);
                logger.info(`[JOB] Sent return reminder to ${booking.User.email} for booking ${booking.id}`);
            } catch (emailError) {
                 logger.error(`[JOB] Failed to send reminder email to ${booking.User.email} for booking ${booking.id}:`, emailError);
            }
            // Tambahkan jeda kecil jika mengirim banyak email untuk menghindari rate limit SMTP
            await new Promise(resolve => setTimeout(resolve, 500)); // Jeda 0.5 detik
        }
         logger.info('[JOB] Finished sending return reminders.');

    } catch (error) {
         logger.error('[JOB] Error sending return reminders:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Jakarta"
});


logger.info('Background job scheduler initialized and jobs scheduled.');

// Cara Menjalankan:
// 1. Diimpor di src/app.js: Tambahkan `require('./jobs/app');` di suatu tempat di `src/app.js` setelah inisialisasi model/DB. Jobs akan berjalan di proses yang sama dengan server API.
// 2. Proses Terpisah: Jalankan `node src/jobs/app.js` menggunakan PM2 atau tool sejenis untuk menjaga proses tetap berjalan. Ini lebih baik untuk performa jika jobs berat.