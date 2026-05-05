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

  // =============================
  // ELIMINACIÓN DE RELACIONES (COMPRÓ)
  // =============================

  // Eliminar 1 relación COMPRÓ entre un Usuario y un Producto
  async deleteRelation(userId: string, productId: string) {
    const query = `
      MATCH (u:Usuario {userId: $userId})-[r:COMPRÓ]->(p:Producto {productId: $productId})
      WITH collect(r) AS rels
      WITH rels, size(rels) AS deletedCount
      FOREACH (x IN rels | DELETE x)
      RETURN deletedCount
    `;
    const result = await this.neo4jService.write(query, { userId, productId });
    return { deletedCount: result.records[0]?.get('deletedCount').toNumber() };
  }

  // Eliminar múltiples relaciones COMPRÓ por pares (bulk)
  async deleteManyRelations(pairs: Array<{ userId: string; productId: string }>) {
    const query = `
      UNWIND $pairs AS pair
      MATCH (u:Usuario {userId: pair.userId})-[r:COMPRÓ]->(p:Producto {productId: pair.productId})
      WITH collect(r) AS rels
      WITH rels, size(rels) AS deletedCount
      FOREACH (x IN rels | DELETE x)
      RETURN deletedCount
    `;
    const result = await this.neo4jService.write(query, { pairs });
    return { deletedCount: result.records[0]?.get('deletedCount').toNumber() };
  }

  // ========================================
  // ALGORITMO DATA SCIENCE: Jaccard Index
  // ========================================
  /**
   * Obtiene recomendaciones personalizadas usando Índice de Jaccard
   * 
   * Algoritmo:
   * 1. Obtiene el usuario base y sus intereses
   * 2. Busca otros usuarios con intereses en común
   * 3. Identifica productos que compraron pero el usuario base NO ha comprado
   * 4. Calcula similitud Jaccard: |Intersección| / |Unión| de intereses
   * 5. Retorna Top 5 productos ordenados por score
   * 
   * @param userId ID del usuario para el cual generar recomendaciones
   * @returns Array de recomendaciones con scores Jaccard
   */
  async getRecommendationsForUser(userId: string) {
    const query = `
  // PASO 1: Obtener usuario base y sus intereses
  MATCH (u1:Usuario {userId: $userId})
  WHERE u1.intereses IS NOT NULL
  
  // PASO 2: Encontrar otros usuarios que compraron productos
  MATCH (u2:Usuario)-[:COMPRÓ]->(p:Producto)
  WHERE u1 <> u2 
    AND u2.intereses IS NOT NULL 
    AND NOT (u1)-[:COMPRÓ]->(p)
  
  // PASO 3: Calcular intereses en común
  WITH u1, u2, p, [interes IN u1.intereses WHERE interes IN u2.intereses] AS interesesComunes
  
  // PASO 4: Calcular Jaccard individual
  WITH p, interesesComunes,
       size(interesesComunes) AS intersectionSize,
       (size(u1.intereses) + size(u2.intereses) - size(interesesComunes)) AS unionSize
  
  // PASO 5: Filtrar resultados con score significativo
  WHERE unionSize > 0 AND intersectionSize > 0
  
  // PASO 6: Calcular score Jaccard
  WITH p, toFloat(intersectionSize) / toFloat(unionSize) AS jaccardScore, interesesComunes
  
  // PASO 7: Agrupar y promediar scores
  WITH p, COLLECT(jaccardScore) AS scores, COLLECT(DISTINCT interesesComunes) AS interesesComunesLista
  
  // PASO 8: Desempaquetar lista y calcular promedio
  UNWIND scores AS score
  WITH p, avg(score) AS avgScore, interesesComunesLista[0] AS interesesComunes
  
  // PASO 9: Retornar Top 5
  RETURN {
    productId: p.productId,
    nombre: p.nombre,
    precio: p.precio,
    enStock: p.enStock,
    tags: p.tags,
    jaccardScore: ROUND(avgScore * 100) / 100,
    interesesComunes: interesesComunes,
    razon: "Usuarios con intereses similares compraron este producto"
  } AS recomendacion
  
  ORDER BY avgScore DESC
  LIMIT 5
`;

    try {
      const result = await this.neo4jService.read(query, { userId });

      // Validar que existan recomendaciones
      if (!result.records || result.records.length === 0) {
        return {
          userId,
          recomendaciones: [],
          mensaje: "No se encontraron recomendaciones personalizadas en este momento",
          algoritmo: "User-Based Content Filtering (Jaccard Index)"
        };
      }

      // Mapear resultados
      const recomendaciones = result.records.map((record) => 
        record.get('recomendacion')
      );

      return {
        userId,
        totalRecomendaciones: recomendaciones.length,
        algoritmo: "User-Based Content Filtering (Jaccard Index)",
        recomendaciones
      };

    } catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Error en getRecommendationsForUser:', error);
  throw new Error(`Error al calcular recomendaciones: ${errorMessage}`);
}
  }
}
