import { Controller, Get, Param, Query, Patch, Body, Put, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ========================================
  // VISUALIZACIÓN DE NODOS (Ya implementado)
  // ========================================
  @Get()
  async getMany(
    @Query('enStock') enStock?: string,
    @Query('minPrecio') minPrecio?: string,
    @Query('maxPrecio') maxPrecio?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.productsService.findMany({ enStock, minPrecio, maxPrecio, limit });
    return { message: 'Consulta de múltiples nodos exitosa', count: data.length, data };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const data = await this.productsService.findOne(id);
    return { message: 'Consulta de 1 nodo exitosa', data };
  }

  // ========================================
  // GESTIÓN DE PROPIEDADES EN NODOS (Nuevo)
  // ========================================

  // 2. Agregar propiedades a múltiples nodos
  @Patch('bulk/properties/add')
  async addPropsToMany(@Body() body: { productIds: string[]; properties: Record<string, any> }) {
    const result = await this.productsService.addPropertiesToMany(body.productIds, body.properties);
    return { message: `Propiedades agregadas a ${result.count} nodos exitosamente` };
  }

  // 1. Agregar propiedades a 1 nodo
  @Patch(':id/properties/add')
  async addPropsToOne(@Param('id') id: string, @Body() properties: Record<string, any>) {
    const data = await this.productsService.addPropertiesToOne(id, properties);
    return { message: 'Propiedades agregadas al nodo exitosamente', data };
  }

  // 4. Actualizar propiedades de múltiples nodos
  @Put('bulk/properties/update')
  async updatePropsToMany(@Body() body: { productIds: string[]; properties: Record<string, any> }) {
    const result = await this.productsService.updatePropertiesToMany(body.productIds, body.properties);
    return { message: `Propiedades actualizadas en ${result.count} nodos exitosamente` };
  }

  // 3. Actualizar propiedades de 1 nodo
  @Put(':id/properties/update')
  async updatePropsToOne(@Param('id') id: string, @Body() properties: Record<string, any>) {
    const data = await this.productsService.updatePropertiesToOne(id, properties);
    return { message: 'Propiedades actualizadas en el nodo exitosamente', data };
  }

  // 6. Eliminar propiedades de múltiples nodos
  @Delete('bulk/properties/remove')
  async removePropsFromMany(@Body() body: { productIds: string[]; keys: string[] }) {
    const result = await this.productsService.removePropertiesFromMany(body.productIds, body.keys);
    return { message: `Propiedades eliminadas de ${result.count} nodos exitosamente` };
  }

  // 5. Eliminar propiedades de 1 nodo
  @Delete(':id/properties/remove')
  async removePropsFromOne(@Param('id') id: string, @Body() body: { keys: string[] }) {
    const data = await this.productsService.removePropertiesFromOne(id, body.keys);
    return { message: 'Propiedades eliminadas del nodo exitosamente', data };
  }

  // =============================
  // ELIMINACIÓN DE NODOS
  // =============================

  // Eliminar múltiples nodos Producto (DEBE ir ANTES de :id para evitar conflicto de rutas)
  @Delete('bulk')
  async deleteMany(@Body() body: { productIds: string[] }) {
    const result = await this.productsService.deleteMany(body.productIds);
    return { message: `Eliminados ${result.deletedCount} nodos`, data: result };
  }

  // Eliminar 1 nodo Producto (y sus relaciones)
  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    const result = await this.productsService.deleteOne(id);
    return { message: `Nodo ${id} eliminado`, data: result };
  }
}
