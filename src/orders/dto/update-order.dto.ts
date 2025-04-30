// backend/backend-rentalmobil/src/orders/dto/update-order.dto.ts
import { PartialType } from '@nestjs/mapped-types'; // Atau @nestjs/swagger jika pakai swagger
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger'; // Opsional

// Definisikan kemungkinan status order
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active', // sedang disewa
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Menggunakan PartialType membuat semua field dari CreateOrderDto menjadi opsional
export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  // Anda bisa menambahkan field spesifik untuk update jika perlu
  // atau override validasi jika berbeda dari create

  @ApiPropertyOptional({
      description: 'Status order yang baru',
      enum: OrderStatus,
      example: OrderStatus.CONFIRMED
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status tidak valid' })
  status?: OrderStatus;

 
}