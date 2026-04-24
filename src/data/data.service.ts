import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import csv = require('csv-parser');
import { Readable } from 'stream';

@Injectable()
export class DataService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async loadProductsFromCsv(buffer: Buffer): Promise<{ message: string; count: number }> {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      Readable.from(buffer)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
          try {
            // results is an array of objects representing rows in the CSV
            let count = 0;
            for (const row of results) {
              const query = `
                MERGE (p:Producto {productId: $productId})
                SET p.nombre = $nombre,
                    p.precio = toFloat($precio),
                    p.enStock = toBoolean($enStock),
                    p.tags = split($tags, ','),
                    p.fechaAlta = datetime($fechaAlta)
                    
                MERGE (c:Categoría {categoryId: $categoryId})
                ON CREATE SET c.nombre = 'Categoría Autogenerada', c.nivel = 1, c.activa = true
                
                MERGE (p)-[r:PERTENECE_A]->(c)
                ON CREATE SET r.fechaAsignacion = datetime(), r.esPrincipal = true, r.orden = 1
              `;
              await this.neo4jService.write(query, {
                productId: row.productId,
                nombre: row.nombre,
                precio: row.precio,
                enStock: row.enStock,
                tags: row.tags,
                fechaAlta: row.fechaAlta || new Date().toISOString(),
                categoryId: row.categoryId || 'cat-default'
              });
              count++;
            }
            resolve({ message: 'Productos cargados exitosamente', count });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error: any) => reject(error));
    });
  }
}
