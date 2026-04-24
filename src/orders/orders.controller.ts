import { Controller, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Consultas agregadas de datos
  @Get('stats')
  async getStats() {
    const data = await this.ordersService.getAggregatedStats();
    return {
      message: 'Consulta agregada ejecutada exitosamente',
      data,
    };
  }
}
