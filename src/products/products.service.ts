import { Injectable, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Injectable()
export class ProductsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  // Consultar 1 nodo
  async findOne(productId: string) {
    const query = `
      MATCH (p:Producto {productId: $productId})
      RETURN p
    `;
    const result = await this.neo4jService.read(query, { productId });
    
    if (result.records.length === 0) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }
    return result.records[0]?.get('p').properties;
  }

  // Consultar muchos nodos con filtros
  async findMany(filters: { enStock?: string; minPrecio?: string; maxPrecio?: string; limit?: string }) {
    let query = `MATCH (p:Producto) WHERE 1=1`;
    const params: any = {};

    // Filtros dinámicos
    if (filters.enStock !== undefined) {
      query += ` AND p.enStock = $enStock`;
      params.enStock = filters.enStock === 'true';
    }

    if (filters.minPrecio) {
      query += ` AND p.precio >= toFloat($minPrecio)`;
      params.minPrecio = parseFloat(filters.minPrecio);
    }

    if (filters.maxPrecio) {
      query += ` AND p.precio <= toFloat($maxPrecio)`;
      params.maxPrecio = parseFloat(filters.maxPrecio);
    }

    query += ` RETURN p LIMIT toInteger($limit)`;
    params.limit = parseInt(filters.limit || '50', 10);

    const result = await this.neo4jService.read(query, params);
    return result.records.map((record) => record.get('p').properties);
  }
}
