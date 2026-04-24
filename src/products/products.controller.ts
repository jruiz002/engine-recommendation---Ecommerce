import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Consultar muchos nodos (con base a filtros)
  @Get()
  async getMany(
    @Query('enStock') enStock?: string,
    @Query('minPrecio') minPrecio?: string,
    @Query('maxPrecio') maxPrecio?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.productsService.findMany({ enStock, minPrecio, maxPrecio, limit });
    return {
      message: 'Consulta de múltiples nodos exitosa',
      count: data.length,
      data,
    };
  }

  // Consultar 1 nodo
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const data = await this.productsService.findOne(id);
    return {
      message: 'Consulta de 1 nodo exitosa',
      data,
    };
  }
}
