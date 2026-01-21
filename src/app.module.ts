import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { DataSource } from "typeorm";
import { appDataSourceOptions } from "./config/database.config";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { SharedModule } from "./shared/shared.module";
import { ProductModule } from "./products/product.module";
import { CategoryModule } from "./category/category.module";
import { BrandModule } from "./brand/brand.module";
import { CartModule } from "./cart/cart.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { OrdersModule } from "./orders/orders.module";
import { PromoCodeModule } from "./promo-codes/promo-code.module";
import { ReviewsModule } from "./reviews/reviews.module";
import {CurrencyModule} from './currency/currency.module'
import { GlobalExceptionFilter } from "./filters/global-exception.filter";
import { ThrottlerGuard } from "@nestjs/throttler";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Cache
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
      max: 100, // maximum number of items in cache
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000, // 1 second
        limit: 1000, // 1000 requests per second
      },
      {
        name: "medium",
        ttl: 10000, // 10 seconds
        limit: 10000, // 10000 requests per 10 seconds
      },
      {
        name: "long",
        ttl: 60000, // 1 minute
        limit: 50000, // 50000 requests per minute
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
    ProductModule,
    CategoryModule,
    BrandModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    PromoCodeModule,
    ReviewsModule,
    CurrencyModule,
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
