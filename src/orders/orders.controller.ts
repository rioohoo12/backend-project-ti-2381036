// backend/backend-rentalmobil/src/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe, // Untuk validasi ID number
  NotFoundException,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger'; // Opsional

@ApiTags('Orders') // Grouping di Swagger UI
@Controller('orders') // Base route -> /orders
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) // Validasi DTO otomatis
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Membuat order sewa baru' })
  @ApiResponse({ status: 201, description: 'Order berhasil dibuat.'})
  @ApiResponse({ status: 400, description: 'Input tidak valid.'})
  @ApiBody({ type: CreateOrderDto })
  async create(@Body() createOrderDto: CreateOrderDto) {
    // Anda mungkin perlu mendapatkan userId dari request (misal: JWT token)
    // daripada mengandalkannya dari body, tergantung flow auth Anda.
    try {
      const newOrder = await this.ordersService.create(createOrderDto);
      return newOrder;
    } catch (error) {
      // Handle error spesifik dari service jika perlu (misal: mobil tidak tersedia)
      throw error; // Re-throw atau return error response yang sesuai
    }
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua data order' })
  @ApiResponse({ status: 200, description: 'List semua order.'})
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail satu order berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID Order', type: Number })
  @ApiResponse({ status: 200, description: 'Detail order.'})
  @ApiResponse({ status: 404, description: 'Order tidak ditemukan.'})
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const order = await this.ordersService.findOne(id);
    if (!order) {
      throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan`);
    }
    return order;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Memperbarui data order berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID Order', type: Number })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Order berhasil diperbarui.'})
  @ApiResponse({ status: 404, description: 'Order tidak ditemukan.'})
  @ApiResponse({ status: 400, description: 'Input tidak valid.'})
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
     try {
        const updatedOrder = await this.ordersService.update(id, updateOrderDto);
        return updatedOrder;
     } catch (error) {
         if (error instanceof NotFoundException) {
             throw new NotFoundException(error.message);
         }
         // Handle error lain jika perlu
         throw error;
     }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus order berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID Order', type: Number })
  @ApiResponse({ status: 204, description: 'Order berhasil dihapus.'})
  @ApiResponse({ status: 404, description: 'Order tidak ditemukan.'})
  @HttpCode(HttpStatus.NO_CONTENT) // Return 204 No Content on success
  async remove(@Param('id', ParseIntPipe) id: number) {
     try {
        await this.ordersService.remove(id);
        // Tidak perlu return body untuk DELETE sukses
     } catch (error) {
          if (error instanceof NotFoundException) {
             throw new NotFoundException(error.message);
         }
         throw error;
     }
  }
}