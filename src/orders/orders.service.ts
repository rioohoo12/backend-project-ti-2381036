// backend/backend-rentalmobil/src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, OrderStatus } from './dto/update-order.dto';
// import { InjectRepository } from '@nestjs/typeorm'; // Uncomment jika pakai TypeORM
// import { Repository } from 'typeorm'; // Uncomment jika pakai TypeORM
// import { Order } from './entities/order.entity'; // Import entity Order
// import { Car } from '../cars/entities/car.entity'; // Import entity Car
// import { User } from '../users/entities/user.entity'; // Import entity User

@Injectable()
export class OrdersService {

  // --- Placeholder jika belum pakai database ---
  private orders: any[] = [
      { id: 1, userId: 1, carId: 2, startDate: '2024-08-10T09:00:00Z', endDate: '2024-08-12T09:00:00Z', totalPrice: 600000, status: OrderStatus.COMPLETED, createdAt: new Date() },
      { id: 2, userId: 2, carId: 1, startDate: '2024-08-15T10:00:00Z', endDate: '2024-08-18T10:00:00Z', totalPrice: 900000, status: OrderStatus.CONFIRMED, createdAt: new Date() },
  ];
  private nextId = 3;
  // --- End Placeholder ---


  // --- Contoh jika menggunakan TypeORM ---
  // constructor(
  //   @InjectRepository(Order)
  //   private ordersRepository: Repository<Order>,
  //   @InjectRepository(Car) // Inject repo lain jika perlu
  //   private carsRepository: Repository<Car>,
  //   @InjectRepository(User) // Inject repo lain jika perlu
  //   private usersRepository: Repository<User>,
  // ) {}
  // --- End Contoh TypeORM ---


  async create(createOrderDto: CreateOrderDto): Promise<any> { // Ganti 'any' dengan 'Order' entity jika pakai ORM
    console.log('Creating order with data:', createOrderDto);

    // --- Logika Bisnis (PENTING!) ---
    // 1. Validasi Input Lebih Lanjut (misal: endDate > startDate)
    if (new Date(createOrderDto.endDate) <= new Date(createOrderDto.startDate)) {
        throw new BadRequestException('Tanggal selesai harus setelah tanggal mulai');
    }

    // 2. Cek Keberadaan User dan Mobil (jika pakai DB)
    // const user = await this.usersRepository.findOneBy({ id: createOrderDto.userId });
    // if (!user) throw new NotFoundException(`User dengan ID ${createOrderDto.userId} tidak ditemukan`);
    // const car = await this.carsRepository.findOneBy({ id: createOrderDto.carId });
    // if (!car) throw new NotFoundException(`Mobil dengan ID ${createOrderDto.carId} tidak ditemukan`);

    // 3. Cek Ketersediaan Mobil pada rentang tanggal yang diminta (ini kompleks!)
    //    Query ke order lain untuk mobil yg sama, cek overlap tanggal.
    //    Jika tidak tersedia, throw BadRequestException('Mobil tidak tersedia pada tanggal tersebut');

    // 4. Hitung Total Harga (jika tidak disediakan atau perlu divalidasi)
    //    Misal: const durationDays = calculateDuration(createOrderDto.startDate, createOrderDto.endDate);
    //    const calculatedPrice = durationDays * car.dailyRate;
    //    createOrderDto.totalPrice = calculatedPrice; // Atau bandingkan jika ada di DTO

    // 5. Simpan ke Database (jika pakai DB)
    // const newOrderEntity = this.ordersRepository.create({
    //     ...createOrderDto,
    //     status: OrderStatus.PENDING, // Set status awal
    //     // user: user, // Assign relasi jika pakai ORM
    //     // car: car,   // Assign relasi jika pakai ORM
    // });
    // try {
    //     const savedOrder = await this.ordersRepository.save(newOrderEntity);
    //     console.log('Order saved:', savedOrder);
    //     return savedOrder;
    // } catch (error) {
    //     console.error("Error saving order:", error);
    //     throw new InternalServerErrorException('Gagal menyimpan order');
    // }

    // --- Logic Placeholder ---
    const newOrder = {
      id: this.nextId++,
      ...createOrderDto,
      status: OrderStatus.PENDING, // Status default saat dibuat
      totalPrice: createOrderDto.totalPrice ?? this.calculatePlaceholderPrice(createOrderDto.startDate, createOrderDto.endDate),
      createdAt: new Date(),
    };
    this.orders.push(newOrder);
    console.log('Order created (placeholder):', newOrder);
    return newOrder;
    // --- End Placeholder ---
  }

  async findAll(): Promise<any[]> { // Ganti 'any[]' dengan 'Order[]'
    console.log('Finding all orders');
    // return this.ordersRepository.find({ relations: ['user', 'car']}); // Contoh TypeORM dgn relasi
    return this.orders; // Placeholder
  }

  async findOne(id: number): Promise<any | null> { // Ganti 'any' dengan 'Order'
    console.log(`Finding order with id: ${id}`);
    // const order = await this.ordersRepository.findOne({ where: { id }, relations: ['user', 'car'] }); // Contoh TypeORM
    // if (!order) {
    //   return null; // Controller akan handle NotFoundException
    // }
    // return order;

    // --- Placeholder ---
    const order = this.orders.find(o => o.id === id);
    return order || null;
    // --- End Placeholder ---
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<any> { // Ganti 'any' dengan 'Order'
    console.log(`Updating order ${id} with data:`, updateOrderDto);
    // const order = await this.ordersRepository.findOneBy({ id }); // Contoh TypeORM
    // if (!order) {
    //   throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan`);
    // }

    // --- Placeholder ---
    const orderIndex = this.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan`);
    }
    // --- End Placeholder ---

    // --- Logika Bisnis Update ---
    // 1. Validasi Lanjutan (jika tanggal diubah, cek ulang ketersediaan & harga)
    if (updateOrderDto.startDate && updateOrderDto.endDate && new Date(updateOrderDto.endDate) <= new Date(updateOrderDto.startDate)) {
         throw new BadRequestException('Tanggal selesai harus setelah tanggal mulai');
    }
    // Cek ulang ketersediaan jika tanggal berubah...
    // Hitung ulang harga jika tanggal atau mobil berubah...

    // 2. Update data di DB (Contoh TypeORM)
    // Object.assign(order, updateOrderDto); // Campurkan data baru ke entity yg ada
    // try {
    //     const updatedOrder = await this.ordersRepository.save(order);
    //     console.log('Order updated:', updatedOrder);
    //     return updatedOrder;
    // } catch (error) {
    //     console.error("Error updating order:", error);
    //     throw new InternalServerErrorException('Gagal memperbarui order');
    // }


    // --- Placeholder ---
    const existingOrder = this.orders[orderIndex];
    // Gabungkan data lama dengan data baru
    this.orders[orderIndex] = { ...existingOrder, ...updateOrderDto };
    // Hitung ulang harga jika tanggal berubah (contoh sederhana)
    if (updateOrderDto.startDate || updateOrderDto.endDate) {
        this.orders[orderIndex].totalPrice = this.calculatePlaceholderPrice(
            this.orders[orderIndex].startDate,
            this.orders[orderIndex].endDate
        );
    }
    console.log('Order updated (placeholder):', this.orders[orderIndex]);
    return this.orders[orderIndex];
    // --- End Placeholder ---
  }

  async remove(id: number): Promise<void> {
    console.log(`Removing order with id: ${id}`);
    // const result = await this.ordersRepository.delete(id); // Contoh TypeORM
    // if (result.affected === 0) {
    //   throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan`);
    // }
    // console.log(`Order ${id} removed`);


    // --- Placeholder ---
     const orderIndex = this.orders.findIndex(o => o.id === id);
     if (orderIndex === -1) {
       throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan`);
     }
     this.orders.splice(orderIndex, 1);
     console.log(`Order ${id} removed (placeholder)`);
    // --- End Placeholder ---
  }

  // --- Helper Placeholder ---
  private calculatePlaceholderPrice(startDate: string, endDate: string): number {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const durationMillis = end - start;
      const durationDays = Math.ceil(durationMillis / (1000 * 60 * 60 * 24)); // Pembulatan ke atas
      return durationDays * 300000; // Harga placeholder per hari
  }
  // --- End Helper Placeholder ---
}