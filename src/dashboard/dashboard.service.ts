// backend/backend-rentalmobil/src/dashboard/dashboard.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
// import { CarsService } from '../cars/cars.service';
import { OrderStatus } from '../orders/dto/update-order.dto';
import { ApiProperty } from '@nestjs/swagger'; // <-- Import ApiProperty

// --- Ubah dari interface menjadi class DTO ---
export class DashboardSummaryDto {
  @ApiProperty({ description: 'Jumlah total order', example: 150 })
  totalOrders: number;

  @ApiProperty({ description: 'Jumlah order yang masih pending', example: 5 })
  pendingOrders: number;

  @ApiProperty({ description: 'Jumlah order yang sudah dikonfirmasi', example: 10 })
  confirmedOrders: number;

  @ApiProperty({ description: 'Jumlah penyewaan yang sedang aktif', example: 8 })
  activeRentals: number;

  @ApiProperty({ description: 'Jumlah order yang sudah selesai', example: 127 })
  completedOrders: number;

  @ApiProperty({ description: 'Jumlah total pengguna terdaftar', example: 50 })
  totalUsers: number;

  // @ApiProperty({ description: 'Jumlah total mobil', example: 25 })
  // totalCars: number;

  // @ApiProperty({ description: 'Jumlah mobil yang tersedia', example: 17 })
  // availableCars: number;

  // @ApiProperty({ description: 'Jumlah mobil yang sedang disewa', example: 8 })
  // rentedCars: number;

  // @ApiPropertyOptional({ description: 'Total pendapatan (jika dihitung)', example: 75000000 })
  // totalRevenue?: number;
}
// --- Akhir perubahan ---

@Injectable()
export class DashboardService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    // private readonly carsService: CarsService,
  ) {}

  // --- Ubah tipe return promise menjadi class DTO ---
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    try {
      // ... (logika pengambilan data tetap sama) ...
      const allOrders = await this.ordersService.findAll();
      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(o => o.status === OrderStatus.PENDING).length;
      const confirmedOrders = allOrders.filter(o => o.status === OrderStatus.CONFIRMED).length;
      const activeRentals = allOrders.filter(o => o.status === OrderStatus.ACTIVE).length;
      const completedOrders = allOrders.filter(o => o.status === OrderStatus.COMPLETED).length;

      const allUsers = await this.usersService.findAll();
      const totalUsers = allUsers.length;

      // const totalCars = await this.carsService.countAll();
      // const availableCars = await this.carsService.countAvailable();
      // const rentedCars = await this.carsService.countRented();

      // --- Pastikan objek yang dikembalikan sesuai dengan class DTO ---
      const summary: DashboardSummaryDto = {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        activeRentals,
        completedOrders,
        totalUsers,
        // totalCars,
        // availableCars,
        // rentedCars,
      };

      return summary;

    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw new InternalServerErrorException('Gagal mengambil data ringkasan dashboard');
    }
  }
}