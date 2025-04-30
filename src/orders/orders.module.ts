// backend/backend-rentalmobil/src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
// import { TypeOrmModule } from '@nestjs/typeorm'; // Uncomment jika pakai TypeORM
// import { Order } from './entities/order.entity'; // Import entity Order
// import { Car } from '../cars/entities/car.entity'; // Import entity Mobil jika perlu cek ketersediaan
// import { User } from '../users/entities/user.entity'; // Import entity User jika perlu cek user

@Module({
  // imports: [
  //   TypeOrmModule.forFeature([Order, Car, User]) // Daftarkan entity yang digunakan di service ini
  // ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService] // Export service jika akan digunakan oleh module lain
})
export class OrdersModule {}