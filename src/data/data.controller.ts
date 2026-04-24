import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataService } from './data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('csv-productos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsvProductos(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { message: 'Por favor envía un archivo CSV bajo el campo "file"' };
    }
    const result = await this.dataService.loadProductsFromCsv(file.buffer);
    return result;
  }
}
