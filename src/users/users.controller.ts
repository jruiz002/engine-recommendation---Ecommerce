import { Controller, Post, Body } from '@nestjs/common';
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
}
