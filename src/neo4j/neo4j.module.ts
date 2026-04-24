import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import neo4j from 'neo4j-driver';
import { Neo4jService, NEO4J_DRIVER } from './neo4j.service';

@Global()
@Module({})
export class Neo4jModule {
  static forRootAsync(): DynamicModule {
    return {
      module: Neo4jModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: NEO4J_DRIVER,
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => {
            const uri = configService.get<string>('NEO4J_URI', 'bolt://localhost:7687');
            const username = configService.get<string>('NEO4J_USERNAME', 'neo4j');
            const password = configService.get<string>('NEO4J_PASSWORD', 'password');

            const driver = neo4j.driver(
              uri,
              neo4j.auth.basic(username, password),
            );

            await driver.verifyConnectivity();
            return driver;
          },
        },
        Neo4jService,
      ],
      exports: [Neo4jService],
    };
  }
}
