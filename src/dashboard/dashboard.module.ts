// backend/backend-rentalmobil/src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { OrdersModule } from '../orders/orders.module'; // <-- Import module yang servicenya dibutuhkan
import { UsersModule } from '../users/users.module';   // <-- Import module yang servicenya dibutuhkan
// import { CarsModule } from '../cars/cars.module';     // <-- Import module yang servicenya dibutuhkan (jika ada)
// import { AuthModule } from '../auth/auth.module';     // <-- Import jika menggunakan guard dari AuthModule

@Module({
  imports: [
    OrdersModule, // Pastikan OrdersModule mengekspor OrdersService
    UsersModule,  // Pastikan UsersModule mengekspor UsersService
    // CarsModule,   // Pastikan CarsModule mengekspor CarsService (jika ada)
    // AuthModule,   // Jika Anda menggunakan guard dari AuthModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  // Biasanya dashboard module tidak perlu diexport
})
export class DashboardModule {}