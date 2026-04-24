import { OnApplicationShutdown } from '@nestjs/common';
import { Driver, Session, Result } from 'neo4j-driver';
export declare const NEO4J_DRIVER = "NEO4J_DRIVER";
export declare class Neo4jService implements OnApplicationShutdown {
    private readonly driver;
    constructor(driver: Driver);
    onApplicationShutdown(): Promise<void>;
    getReadSession(database?: string): Session;
    getWriteSession(database?: string): Session;
    read(cypher: string, params?: Record<string, any>, database?: string): Result;
    write(cypher: string, params?: Record<string, any>, database?: string): Result;
}
