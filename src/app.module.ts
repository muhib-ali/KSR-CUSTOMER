import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { DataSource } from "typeorm";
import { redisStore } from "cache-manager-redis-yet";
import { appDataSourceOptions } from "./config/database.config";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { SharedModule } from "./shared/shared.module";
import { GlobalExceptionFilter } from "./filters/global-exception.filter";
import { ThrottlerGuard } from "@nestjs/throttler";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Cache with Redis
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        try {
          return {
            store: await redisStore({
              socket: {
                host: process.env.REDIS_HOST || "localhost",
                port: parseInt(process.env.REDIS_PORT || "6379", 10),
              },
              password: process.env.REDIS_PASSWORD,
            }),
            ttl: 900000, // 15 minutes in milliseconds
            max: 1000, // Max items in cache
          };
        } catch (error) {
          console.warn("Redis connection failed, falling back to memory cache");
          return {
            ttl: 900000, // 15 minutes in milliseconds
            max: 1000, // Max items in cache
          };
        }
      },
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: "medium",
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: "long",
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Health checks
    TerminusModule,

    // Shared global services
    SharedModule,

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: async () => ({
        ...appDataSourceOptions,
        autoLoadEntities: true,
      }),
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options);
        return dataSource.initialize();
      },
    }),

    // App modules
    AuthModule,
    HealthModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    return;
  }
}
