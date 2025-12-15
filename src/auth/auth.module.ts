import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Customer } from "../entities/customer.entity";
import { CustomerToken } from "../entities/customer-token.entity";
import { Role } from "../entities/role.entity";
import { AppConfigService } from "../config/config.service";
import { CacheService } from "../cache/cache.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerToken,
      Role,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || "your-secret-key",
        signOptions: {
          expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
        },
      }),
    }),
    // Rate limiting for auth endpoints
    ThrottlerModule.forRoot([
      {
        name: "auth",
        ttl: 60000, // 1 minute
        limit: 10, // 10 login attempts per minute
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
