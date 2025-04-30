// backend/backend-rentalmobil/src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
// --- Impor class DTO, bukan interface ---
import { DashboardService, DashboardSummaryDto } from './dashboard.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// ... (import guard lainnya jika perlu) ...

@ApiTags('Dashboard')
@Controller('dashboard')
// @UseGuards(...)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Mendapatkan ringkasan data dashboard' })
  // --- Gunakan class DTO di ApiResponse ---
  @ApiResponse({ status: 200, description: 'Ringkasan data berhasil diambil.', type: DashboardSummaryDto })
  @ApiResponse({ status: 500, description: 'Gagal mengambil data.'})
  // @Roles(Role.Admin)
  // --- Gunakan class DTO sebagai tipe return Promise ---
  async getSummary(): Promise<DashboardSummaryDto> {
    return this.dashboardService.getDashboardSummary();
  }
}