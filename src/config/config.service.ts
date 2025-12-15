import { Injectable } from "@nestjs/common";

@Injectable()
export class AppConfigService {
  get port(): number {
    return parseInt(process.env.APP_PORT || "3000", 10);
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || "your-secret-key";
  }

  get jwtAccessExpires(): string {
    return process.env.JWT_ACCESS_EXPIRES || "15m";
  }

  get jwtAccessExpiresMinutes(): number {
    return parseInt(process.env.JWT_ACCESS_EXPIRES_MINUTES || "15", 10);
  }

  get jwtRefreshExpires(): string {
    return process.env.JWT_REFRESH_EXPIRES || "7d";
  }

  get redisHost(): string {
    return process.env.REDIS_HOST || "localhost";
  }

  get redisPort(): number {
    return parseInt(process.env.REDIS_PORT || "6379", 10);
  }

  get redisPassword(): string | undefined {
    return process.env.REDIS_PASSWORD;
  }

  get dbHost(): string {
    return process.env.DB_HOST || "localhost";
  }

  get dbPort(): number {
    return parseInt(process.env.DB_PORT || "5432", 10);
  }

  get dbUsername(): string {
    return process.env.DB_USERNAME || "postgres";
  }

  get dbPassword(): string {
    return process.env.DB_PASSWORD || "admin@123";
  }

  get dbName(): string {
    return process.env.DB_NAME || "ksrDb";
  }

  get dbSsl(): boolean {
    return process.env.DB_SSL === "true";
  }
}
