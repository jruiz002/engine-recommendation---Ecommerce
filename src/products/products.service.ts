import { Injectable, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Injectable()
export class ProductsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  // ========================================
  // VISUALIZACIÓN DE NODOS (Ya implementado)
  // ========================================

  async findOne(productId: string) {
    const query = `MATCH (p:Producto {productId: $productId}) RETURN p`;
    const result = await this.neo4jService.read(query, { productId });
    if (result.records.length === 0) throw new NotFoundException('Producto no encontrado');
    return result.records[0]?.get('p').properties;
  }

  async findMany(filters: { enStock?: string; minPrecio?: string; maxPrecio?: string; limit?: string }) {
    let query = `MATCH (p:Producto) WHERE 1=1`;
    const params: any = {};
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

  // ========================================
  // GESTIÓN DE PROPIEDADES EN NODOS (Nuevo)
  // ========================================

  // 1. Agregar 1 o más propiedades a un nodo
  async addPropertiesToOne(productId: string, properties: Record<string, any>) {
    const query = `
      MATCH (p:Producto {productId: $productId})
      SET p += $properties
      RETURN p
    `;
    const result = await this.neo4jService.write(query, { productId, properties });
    return result.records[0]?.get('p').properties;
  }

  // 2. Agregar 1 o más propiedades a múltiples nodos al mismo tiempo
  async addPropertiesToMany(productIds: string[], properties: Record<string, any>) {
    const query = `
      MATCH (p:Producto) WHERE p.productId IN $productIds
      SET p += $properties
      RETURN count(p) as updatedCount
    `;
    const result = await this.neo4jService.write(query, { productIds, properties });
    return { count: result.records[0]?.get('updatedCount').toNumber() };
  }

  // 3. Actualizar 1 o más propiedades de un nodo
  async updatePropertiesToOne(productId: string, properties: Record<string, any>) {
    // Cypher SET funciona tanto para agregar como actualizar, usamos la misma lógica subyacente
    const query = `
      MATCH (p:Producto {productId: $productId})
      SET p += $properties
      RETURN p
    `;
    const result = await this.neo4jService.write(query, { productId, properties });
    return result.records[0]?.get('p').properties;
  }

  // 4. Actualizar 1 o más propiedades de múltiples nodos al mismo tiempo
  async updatePropertiesToMany(productIds: string[], properties: Record<string, any>) {
    const query = `
      MATCH (p:Producto) WHERE p.productId IN $productIds
      SET p += $properties
      RETURN count(p) as updatedCount
    `;
    const result = await this.neo4jService.write(query, { productIds, properties });
    return { count: result.records[0]?.get('updatedCount').toNumber() };
  }

  // 5. Eliminar 1 o más propiedades de un nodo
  async removePropertiesFromOne(productId: string, propertyKeys: string[]) {
    // Usamos apoc.create.removeProperties o un workaround con REMOVE dinámico.
    // Sin APOC, SET p.prop = null borra la propiedad.
    let removeQuery = propertyKeys.map(k => `p.${k} = null`).join(', ');
    const query = `
      MATCH (p:Producto {productId: $productId})
      SET ${removeQuery}
      RETURN p
    `;
    const result = await this.neo4jService.write(query, { productId });
    return result.records[0]?.get('p').properties;
  }

  // 6. Eliminar 1 o más propiedades de múltiples nodos al mismo tiempo
  async removePropertiesFromMany(productIds: string[], propertyKeys: string[]) {
    let removeQuery = propertyKeys.map(k => `p.${k} = null`).join(', ');
    const query = `
      MATCH (p:Producto) WHERE p.productId IN $productIds
      SET ${removeQuery}
      RETURN count(p) as updatedCount
    `;
    const result = await this.neo4jService.write(query, { productIds });
    return { count: result.records[0]?.get('updatedCount').toNumber() };
  }

  // =============================
  // ELIMINACIÓN DE NODOS (Producto)
  // =============================

  // Eliminar 1 nodo Producto (y sus relaciones) usando DETACH DELETE
  async deleteOne(productId: string) {
    const query = `
      MATCH (p:Producto {productId: $productId})
      WITH collect(p) AS nodes, size(collect(p)) AS deletedCount
      FOREACH (n IN nodes | DETACH DELETE n)
      RETURN deletedCount
    `;
    const result = await this.neo4jService.write(query, { productId });
    return { deletedCount: result.records[0]?.get('deletedCount').toNumber() };
  }

  // Eliminar múltiples nodos Producto por lista de productIds
  async deleteMany(productIds: string[]) {
    const query = `
      UNWIND $productIds AS id
      MATCH (p:Producto {productId: id})
      WITH collect(p) AS nodes, size(collect(p)) AS deletedCount
      FOREACH (n IN nodes | DETACH DELETE n)
      RETURN deletedCount
    `;
    const result = await this.neo4jService.write(query, { productIds });
    return { deletedCount: result.records[0]?.get('deletedCount').toNumber() };
  }
}
