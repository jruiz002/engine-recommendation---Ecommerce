import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Injectable()
export class OrdersService {
  constructor(private readonly neo4jService: Neo4jService) {}

  // Consultas agregadas de datos
  async getAggregatedStats() {
    const query = `
      MATCH (o:Orden)
      RETURN 
        count(o) AS totalOrders,
        sum(o.total) AS totalIngresos,
        avg(o.total) AS promedioTicket,
        max(o.total) AS ordenMasCara,
        min(o.total) AS ordenMasBarata
    `;
    const result = await this.neo4jService.read(query);
    
    if (result.records.length === 0) {
      return { message: 'No hay suficientes datos para agregar' };
    }

    const record = result.records[0];
    return {
      totalOrders: record.get('totalOrders').toNumber(),
      totalIngresos: record.get('totalIngresos'),
      promedioTicket: record.get('promedioTicket'),
      ordenMasCara: record.get('ordenMasCara'),
      ordenMasBarata: record.get('ordenMasBarata'),
    };
  }
}
