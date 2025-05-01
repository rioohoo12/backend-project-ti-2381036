const { Booking, Car, User, sequelize } = require('../models'); // Pastikan User diimpor
const { Op } = require('sequelize'); // Import Op untuk query kompleks
const midtransClient = require('midtrans-client');
const logger = require('../utils/logger'); // Gunakan logger yang sudah dibuat
require('dotenv').config();

// --- Inisialisasi Klien Midtrans ---
let snap;
const isProduction = process.env.NODE_ENV === 'production';
const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;

if (serverKey && clientKey) {
    snap = new midtransClient.Snap({
        isProduction: isProduction,
        serverKey: serverKey,
        clientKey: clientKey
    });
    logger.info(`Midtrans Snap client initialized for ${isProduction ? 'Production' : 'Sandbox'} environment.`);
} else {
    logger.warn('Midtrans Server Key or Client Key not found in environment variables. Payment gateway functionality will be disabled.');
    snap = null;
}

// --- Helper Functions ---
const getUserNameParts = (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
        return { firstName: 'Customer', lastName: '' };
    }
    const names = fullName.trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ');
    return { firstName, lastName: lastName || firstName };
}

// --- Service Functions ---

/**
 * Memulai proses pembayaran Midtrans Snap untuk booking.
 * @param {string} bookingId - UUID dari booking.
 * @param {string} userId - UUID dari user yang melakukan booking.
 * @returns {Promise<object>} - Object berisi data untuk frontend (e.g., paymentToken).
 * @throws {Error} - Jika gateway tidak terkonfigurasi atau terjadi error lain.
 */
const initiatePayment = async (bookingId, userId) => {
    if (!snap) {
        logger.error('Attempted to initiate payment, but Midtrans client is not configured.');
        throw new Error('Payment gateway is not configured. Please check server configuration.');
    }

    logger.info(`Initiating payment for bookingId: ${bookingId}, userId: ${userId}`);
    try {
        const booking = await Booking.findOne({
            where: {
                id: bookingId,
                userId: userId,
                status: 'pending' // Hanya proses booking yang masih pending
            },
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: Car, attributes: ['id', 'make', 'model'] }
            ]
        });

        if (!booking) {
            logger.warn(`Pending booking not found for id: ${bookingId}, userId: ${userId}`);
            throw { statusCode: 404, message: 'Pending booking not found for this user', isOperational: true };
        }

        if (!booking.User || !booking.Car) {
             logger.error(`Booking ${bookingId} is missing User or Car association.`);
             throw new Error('Booking data is incomplete.');
        }

        const { firstName, lastName } = getUserNameParts(booking.User.name);

        const parameter = {
            transaction_details: {
                order_id: booking.id,
                gross_amount: parseFloat(booking.totalCost)
            },
            customer_details: {
                first_name: firstName,
                last_name: lastName,
                email: booking.User.email,
                // phone: booking.User.phone // Tambahkan jika ada
            },
            item_details: [{
                id: booking.Car.id,
                price: parseFloat(booking.totalCost),
                quantity: 1,
                name: `Rental ${booking.Car.make} ${booking.Car.model}`,
                brand: booking.Car.make,
                category: 'Car Rental',
            }],
            // expiry: { // Sesuaikan jika perlu
            //     start_time: new Date().toISOString().slice(0, 19) + " +0700",
            //     unit: "minutes",
            //     duration: 60
            // }
        };

        logger.debug(`Creating Midtrans transaction for orderId: ${booking.id}`);
        const transaction = await snap.createTransaction(parameter);
        const paymentToken = transaction.token;
        const paymentRedirectUrl = transaction.redirect_url;

        logger.info(`Midtrans transaction created successfully for orderId: ${booking.id}.`);

        return {
            bookingId: booking.id,
            totalAmount: booking.totalCost,
            paymentToken: paymentToken,
            paymentRedirectUrl: paymentRedirectUrl,
            message: "Payment initiated successfully."
        };

    } catch (error) {
        logger.error(`Error initiating payment for booking ${bookingId}:`, error);
        if (error.httpStatusCode) {
             throw new Error(`Payment gateway error (${error.httpStatusCode}): ${error.ApiResponse?.status_message || error.message}`);
        }
        if (error.isOperational) throw error;
        throw new Error(`Failed to initiate payment. ${error.message}`);
    }
};

/**
 * Menangani notifikasi pembayaran (webhook) dari Midtrans.
 * @param {object} notificationPayload - Payload JSON yang dikirim oleh Midtrans.
 * @returns {Promise<object>} - Object berisi status pemrosesan { success: boolean, message: string }.
 * @throws {Error} - Jika gateway tidak terkonfigurasi atau terjadi error saat verifikasi/update.
 */
const handlePaymentNotification = async (notificationPayload) => {
    if (!snap) {
        logger.error('Attempted to handle payment notification, but Midtrans client is not configured.');
        // Sebaiknya tetap throw error agar pemanggil tahu ada masalah konfigurasi
        throw new Error('Payment gateway is not configured.');
    }

    const transaction = await sequelize.transaction();
    let orderId = notificationPayload?.order_id || 'UNKNOWN';

    logger.info(`Received payment notification for orderId: ${orderId}.`);
    logger.debug('Notification Payload:', notificationPayload);

    try {
        // 1. Verifikasi Notifikasi
        const statusResponse = await snap.transaction.notification(notificationPayload);
        orderId = statusResponse.order_id; // Update orderId dari response terverifikasi
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;
        const paymentType = statusResponse.payment_type;

        logger.info(`Verified notification for orderId: ${orderId}. Transaction Status: ${transactionStatus}, Fraud Status: ${fraudStatus}, Payment Type: ${paymentType}`);

        // 2. Cari Booking
        const booking = await Booking.findByPk(orderId, {
            include: [Car], // Include Car untuk update statusnya jika perlu
            transaction
        });

        if (!booking) {
            logger.error(`Booking with ID ${orderId} not found for payment notification.`);
            await transaction.rollback();
            // Kembalikan status 'gagal' tapi tidak throw error agar webhook bisa return 200 OK
            return { success: false, message: `Booking ${orderId} not found.` };
        }

        logger.info(`Found booking ${orderId} with current status: ${booking.status}`);

        // 3. Tentukan Status Booking Baru
        const oldBookingStatus = booking.status;
        let newBookingStatus = oldBookingStatus; // Default tidak berubah
        let shouldUpdateCarStatus = false;
        let newCarStatus = booking.Car?.status;

        // Logika mapping status
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            if (fraudStatus === 'accept') {
                newBookingStatus = 'confirmed';
                if (booking.Car && booking.Car.status === 'available') {
                   shouldUpdateCarStatus = true;
                   newCarStatus = 'rented';
                }
            } else if (fraudStatus === 'challenge') {
                newBookingStatus = 'pending_review';
                logger.warn(`Booking ${orderId} requires fraud review. Status set to ${newBookingStatus}.`);
            } else { // deny
                newBookingStatus = 'cancelled';
                logger.warn(`Booking ${orderId} denied due to fraud status: ${fraudStatus}. Status set to ${newBookingStatus}.`);
            }
        } else if (transactionStatus === 'pending') {
            newBookingStatus = 'pending'; // Tetap pending
        } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
            newBookingStatus = 'cancelled';
        }
        // Handle 'refund' jika perlu
        // else if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
        //    newBookingStatus = 'refunded';
        // }

        // 4. Update jika Status Berubah dan Belum Final
        if (newBookingStatus !== oldBookingStatus && !['completed', 'refunded', 'cancelled'].includes(oldBookingStatus)) {
            booking.status = newBookingStatus;
            await booking.save({ transaction });
            logger.info(`Booking ${orderId} status updated from ${oldBookingStatus} to ${newBookingStatus}.`);

            // Update status mobil jika perlu
            if (shouldUpdateCarStatus && booking.Car && booking.Car.status !== newCarStatus) {
                 booking.Car.status = newCarStatus;
                 await booking.Car.save({ transaction });
                 logger.info(`Car ${booking.carId} status updated to ${newCarStatus}.`);
            }
            // Jika dibatalkan (cancelled), cek apakah mobil perlu jadi available
            else if (newBookingStatus === 'cancelled' && booking.Car && oldBookingStatus === 'confirmed' && booking.Car.status === 'rented') {
                 const otherActiveBooking = await Booking.findOne({
                     where: {
                         carId: booking.carId,
                         id: { [Op.ne]: booking.id },
                         status: { [Op.in]: ['confirmed', 'pending'] },
                         // endDate: { [Op.gte]: new Date() } // Opsional: cek relevansi waktu
                     },
                     transaction
                 });

                 if (!otherActiveBooking) {
                     booking.Car.status = 'available';
                     await booking.Car.save({ transaction });
                     logger.info(`Car ${booking.carId} status set back to available.`);
                 } else {
                      logger.info(`Car ${booking.carId} has other active bookings, status remains ${booking.Car.status}.`);
                 }
            }
        } else {
            logger.info(`Booking ${orderId} status (${oldBookingStatus}) remains unchanged or is already final.`);
        }

        // 5. Commit Transaksi
        await transaction.commit();
        logger.info(`Successfully processed notification for orderId: ${orderId}. Final booking status: ${booking.status}`);
        return { success: true, message: 'Notification processed successfully.' };

    } catch (error) {
        await transaction.rollback(); // Rollback jika terjadi error selama proses
        logger.error(`Error handling payment notification for orderId: ${orderId}:`, error);
        // Throw error agar lapisan atas (controller) tahu ada masalah,
        // tapi controller sebaiknya tetap return 200 OK ke Midtrans.
        throw new Error(`Failed to process payment notification. ${error.message}`);
    }
};

module.exports = {
    initiatePayment,
    handlePaymentNotification,
    isPaymentGatewayConfigured: () => !!snap,
};