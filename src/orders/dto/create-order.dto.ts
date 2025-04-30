// backend/backend-rentalmobil/src/orders/dto/create-order.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsPositive,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Opsional, jika pakai Swagger

export class CreateOrderDto {
  @ApiProperty({ description: 'ID Pengguna yang memesan', example: 1 })
  @IsNotEmpty({ message: 'User ID tidak boleh kosong' })
  @IsNumber({}, { message: 'User ID harus berupa angka' })
  @IsPositive({ message: 'User ID harus positif' })
  userId: number;

  @ApiProperty({ description: 'ID Mobil yang dipesan', example: 5 })
  @IsNotEmpty({ message: 'Car ID tidak boleh kosong' })
  @IsNumber({}, { message: 'Car ID harus berupa angka' })
  @IsPositive({ message: 'Car ID harus positif' })
  carId: number;

  @ApiProperty({
    description: 'Tanggal mulai sewa (format ISO 8601)',
    example: '2024-08-15T10:00:00.000Z',
  })
  @IsNotEmpty({ message: 'Tanggal mulai tidak boleh kosong' })
  @IsDateString({}, { message: 'Format tanggal mulai tidak valid' })
  startDate: string; // atau Date, tergantung bagaimana Anda ingin menangani tanggal

  @ApiProperty({
    description: 'Tanggal selesai sewa (format ISO 8601)',
    example: '2024-08-18T10:00:00.000Z',
  })
  @IsNotEmpty({ message: 'Tanggal selesai tidak boleh kosong' })
  @IsDateString({}, { message: 'Format tanggal selesai tidak valid' })
  // Tambahkan validasi custom jika perlu: endDate > startDate
  endDate: string; // atau Date

  @ApiPropertyOptional({
     description: 'Total harga sewa (opsional, bisa dihitung di backend)',
     example: 500000
  })
  @IsOptional()
  @IsNumber({}, { message: 'Total harga harus berupa angka' })
  @Min(0, { message: 'Total harga tidak boleh negatif' })
  totalPrice?: number;

  // Status biasanya di set di backend saat create (misal: 'pending'),
  // jadi tidak perlu di DTO create, kecuali ada kasus khusus.
  // @IsOptional()
  // @IsEnum(OrderStatus) // Buat enum OrderStatus jika perlu
  // status?: OrderStatus;
}