import { Injectable, OnApplicationShutdown, Inject } from '@nestjs/common';
import neo4j, { Driver, Session, Result } from 'neo4j-driver';

export const NEO4J_DRIVER = 'NEO4J_DRIVER';

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  onApplicationShutdown() {
    return this.driver.close();
  }

  getReadSession(database?: string): Session {
    return this.driver.session({
      database: database || 'neo4j',
      defaultAccessMode: neo4j.session.READ,
    });
  }

  getWriteSession(database?: string): Session {
    return this.driver.session({
      database: database || 'neo4j',
      defaultAccessMode: neo4j.session.WRITE,
    });
  }

  read(cypher: string, params?: Record<string, any>, database?: string): Result {
    const session = this.getReadSession(database);
    return session.run(cypher, params);
  }

  write(cypher: string, params?: Record<string, any>, database?: string): Result {
    const session = this.getWriteSession(database);
    return session.run(cypher, params);
  }
}
