import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Injectable()
export class UsersService {
  constructor(private readonly neo4jService: Neo4jService) {}

  // 1. Creación de nodos con 1 label
  async createSingleLabel(userId: string) {
    const query = `
      CREATE (u:Usuario {userId: $userId})
      RETURN u
    `;
    const result = await this.neo4jService.write(query, { userId });
    return result.records[0]?.get('u').properties;
  }

  // 2. Creación de nodos con 2+ labels
  async createMultiLabel(userId: string) {
    // Agregamos las labels 'Usuario' y 'Premium'
    const query = `
      CREATE (u:Usuario:Premium {userId: $userId})
      RETURN u
    `;
    const result = await this.neo4jService.write(query, { userId });
    return result.records[0]?.get('u').properties;
  }

  // 3. Creación de nodos con propiedades (mínimo 5 propiedades)
  async createWithProperties(data: {
    userId: string;
    nombre: string;
    email: string;
    activo: boolean;
    intereses: string[];
    fechaRegistro: string;
  }) {
    const query = `
      CREATE (u:Usuario {
        userId: $userId,
        nombre: $nombre,
        email: $email,
        activo: $activo,
        intereses: $intereses,
        fechaRegistro: datetime($fechaRegistro)
      })
      RETURN u
    `;
    const result = await this.neo4jService.write(query, {
      userId: data.userId,
      nombre: data.nombre,
      email: data.email,
      activo: data.activo,
      intereses: data.intereses,
      fechaRegistro: data.fechaRegistro, // e.g. '2023-10-01T12:00:00Z'
    });
    return result.records[0]?.get('u').properties;
  }

  // Creación de relación con propiedades (entre 2 nodos ya existentes)
  // Tipo de relación: COMPRÓ, con 3 propiedades
  async createRelationCompro(data: {
    userId: string;
    productId: string;
    cantidad: number;
    precioFinal: number;
    fechaCompra: string;
  }) {
    const query = `
      MATCH (u:Usuario {userId: $userId})
      MATCH (p:Producto {productId: $productId})
      CREATE (u)-[r:COMPRÓ {
        cantidad: $cantidad,
        precioFinal: $precioFinal,
        fechaCompra: datetime($fechaCompra)
      }]->(p)
      RETURN type(r) AS tipoRelacion, r.cantidad AS cantidad, r.precioFinal AS precioFinal, r.fechaCompra AS fechaCompra
    `;
    const result = await this.neo4jService.write(query, {
      userId: data.userId,
      productId: data.productId,
      cantidad: data.cantidad,
      precioFinal: data.precioFinal,
      fechaCompra: data.fechaCompra,
    });
    
    if (result.records.length === 0) {
      throw new Error('No se pudo crear la relación. Verifica que el Usuario y el Producto existan.');
    }
    
    const record = result.records[0];
    return {
      tipoRelacion: record.get('tipoRelacion'),
      cantidad: record.get('cantidad'),
      precioFinal: record.get('precioFinal'),
      fechaCompra: record.get('fechaCompra')
    };
  }

  // =============================
  // GESTIÓN DE PROPIEDADES EN RELACIONES (COMPRÓ)
  // =============================

  // 1. Agregar 1 o más propiedades a una relación entre 2 nodos
  async addPropertiesToRelation(userId: string, productId: string, properties: Record<string, any>) {
    const query = `
      MATCH (u:Usuario {userId: $userId})-[r:COMPRÓ]->(p:Producto {productId: $productId})
      SET r += $properties
      RETURN r
    `;
    const result = await this.neo4jService.write(query, { userId, productId, properties });
    return result.records[0]?.get('r').properties;
  }

  // 2. Agregar 1 o más propiedades a múltiples relaciones al mismo tiempo
  // pairs: [{ userId, productId }, ...]
  async addPropertiesToManyRelations(pairs: Array<{ userId: string; productId: string }>, properties: Record<string, any>) {
    const query = `
      UNWIND $pairs AS pair
      MATCH (u:Usuario {userId: pair.userId})-[r:COMPRÓ]->(p:Producto {productId: pair.productId})
      SET r += $properties
      RETURN count(r) AS updatedCount
    `;
    const result = await this.neo4jService.write(query, { pairs, properties });
    return { count: result.records[0]?.get('updatedCount').toNumber() };
  }

  // 3. Actualizar 1 o más propiedades de una relación (igual que add usando SET)
  async updatePropertiesToRelation(userId: string, productId: string, properties: Record<string, any>) {
    return this.addPropertiesToRelation(userId, productId, properties);
  }

  // 4. Actualizar 1 o más propiedades de múltiples relaciones al mismo tiempo
  async updatePropertiesToManyRelations(pairs: Array<{ userId: string; productId: string }>, properties: Record<string, any>) {
    return this.addPropertiesToManyRelations(pairs, properties);
  }

  // 5. Eliminar 1 o más propiedades de una relación
  async removePropertiesFromRelation(userId: string, productId: string, propertyKeys: string[]) {
    const removeQuery = propertyKeys.map(k => `r.${k} = null`).join(', ');
    const query = `
      MATCH (u:Usuario {userId: $userId})-[r:COMPRÓ]->(p:Producto {productId: $productId})
      SET ${removeQuery}
      RETURN r
    `;
    const result = await this.neo4jService.write(query, { userId, productId });
    return result.records[0]?.get('r').properties;
  }

  // 6. Eliminar 1 o más propiedades de múltiples relaciones al mismo tiempo
  async removePropertiesFromManyRelations(pairs: Array<{ userId: string; productId: string }>, propertyKeys: string[]) {
    const removeQuery = propertyKeys.map(k => `r.${k} = null`).join(', ');
    const query = `
      UNWIND $pairs AS pair
      MATCH (u:Usuario {userId: pair.userId})-[r:COMPRÓ]->(p:Producto {productId: pair.productId})
      SET ${removeQuery}
      RETURN count(r) AS updatedCount
    `;
    const result = await this.neo4jService.write(query, { pairs });
    return { count: result.records[0]?.get('updatedCount').toNumber() };
  }
}
