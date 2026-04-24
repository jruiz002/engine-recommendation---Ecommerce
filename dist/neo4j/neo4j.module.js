"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var Neo4jModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4jModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const neo4j_service_1 = require("./neo4j.service");
let Neo4jModule = Neo4jModule_1 = class Neo4jModule {
    static forRootAsync() {
        return {
            module: Neo4jModule_1,
            imports: [config_1.ConfigModule],
            providers: [
                {
                    provide: neo4j_service_1.NEO4J_DRIVER,
                    inject: [config_1.ConfigService],
                    useFactory: async (configService) => {
                        const uri = configService.get('NEO4J_URI', 'bolt://localhost:7687');
                        const username = configService.get('NEO4J_USERNAME', 'neo4j');
                        const password = configService.get('NEO4J_PASSWORD', 'password');
                        const driver = neo4j_driver_1.default.driver(uri, neo4j_driver_1.default.auth.basic(username, password));
                        await driver.verifyConnectivity();
                        return driver;
                    },
                },
                neo4j_service_1.Neo4jService,
            ],
            exports: [neo4j_service_1.Neo4jService],
        };
    }
};
exports.Neo4jModule = Neo4jModule;
exports.Neo4jModule = Neo4jModule = Neo4jModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], Neo4jModule);
//# sourceMappingURL=neo4j.module.js.map