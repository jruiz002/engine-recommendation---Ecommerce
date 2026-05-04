import { Controller, Post, Body, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('single-label')
  async createSingleLabel(@Body('userId') userId: string) {
    const result = await this.usersService.createSingleLabel(userId);
    return {
      message: 'Nodo con 1 label creado exitosamente',
      data: result,
    };
  }

  @Post('multi-label')
  async createMultiLabel(@Body('userId') userId: string) {
    const result = await this.usersService.createMultiLabel(userId);
    return {
      message: 'Nodo con 2+ labels creado exitosamente',
      data: result,
    };
  }

  @Post('with-properties')
  async createWithProperties(
    @Body()
    body: {
      userId: string;
      nombre: string;
      email: string;
      activo: boolean;
      intereses: string[];
      fechaRegistro: string;
    },
  ) {
    const result = await this.usersService.createWithProperties(body);
    return {
      message: 'Nodo con 5+ propiedades creado exitosamente',
      data: result,
    };
  }

  @Post('relation-compro')
  async createRelationCompro(
    @Body()
    body: {
      userId: string;
      productId: string;
      cantidad: number;
      precioFinal: number;
      fechaCompra: string;
    },
  ) {
    const result = await this.usersService.createRelationCompro(body);
    return {
      message: 'Relación COMPRÓ creada exitosamente con 3 propiedades',
      data: result,
    };
  }

  @Post('relation/add-props')
  async addPropertiesToRelation(
    @Body()
    body: { userId: string; productId: string; properties: Record<string, any> },
  ) {
    const result = await this.usersService.addPropertiesToRelation(body.userId, body.productId, body.properties);
    return { message: 'Propiedades agregadas a la relación', data: result };
  }

  @Post('relation/add-props-many')
  async addPropertiesToManyRelations(
    @Body()
    body: { pairs: Array<{ userId: string; productId: string }>; properties: Record<string, any> },
  ) {
    const result = await this.usersService.addPropertiesToManyRelations(body.pairs, body.properties);
    return { message: 'Propiedades agregadas a relaciones (bulk)', data: result };
  }

  @Post('relation/update-props')
  async updatePropertiesToRelation(
    @Body()
    body: { userId: string; productId: string; properties: Record<string, any> },
  ) {
    const result = await this.usersService.updatePropertiesToRelation(body.userId, body.productId, body.properties);
    return { message: 'Propiedades actualizadas en la relación', data: result };
  }

  @Post('relation/update-props-many')
  async updatePropertiesToManyRelations(
    @Body()
    body: { pairs: Array<{ userId: string; productId: string }>; properties: Record<string, any> },
  ) {
    const result = await this.usersService.updatePropertiesToManyRelations(body.pairs, body.properties);
    return { message: 'Propiedades actualizadas en relaciones (bulk)', data: result };
  }

  @Post('relation/remove-props')
  async removePropertiesFromRelation(
    @Body()
    body: { userId: string; productId: string; propertyKeys: string[] },
  ) {
    const result = await this.usersService.removePropertiesFromRelation(body.userId, body.productId, body.propertyKeys);
    return { message: 'Propiedades eliminadas de la relación', data: result };
  }

  @Post('relation/remove-props-many')
  async removePropertiesFromManyRelations(
    @Body()
    body: { pairs: Array<{ userId: string; productId: string }>; propertyKeys: string[] },
  ) {
    const result = await this.usersService.removePropertiesFromManyRelations(body.pairs, body.propertyKeys);
    return { message: 'Propiedades eliminadas de relaciones (bulk)', data: result };
  }

  @Delete('relation')
  async deleteRelation(@Body() body: { userId: string; productId: string }) {
    const result = await this.usersService.deleteRelation(body.userId, body.productId);
    return { message: 'Relación eliminada', data: result };
  }

  @Delete('relation/bulk')
  async deleteManyRelations(@Body() body: { pairs: Array<{ userId: string; productId: string }> }) {
    const result = await this.usersService.deleteManyRelations(body.pairs);
    return { message: 'Relaciones eliminadas (bulk)', data: result };
  }
}
