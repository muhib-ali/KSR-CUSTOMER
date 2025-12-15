import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      console.warn("Cache reset error:", error);
    }
  }

  // Token-specific cache methods
  generateTokenKey(token: string): string {
    return `token:${token}`;
  }

  generateUserTokenKey(userId: string): string {
    return `user_tokens:${userId}`;
  }

  async cacheTokenData(
    token: string,
    data: any,
    ttlMinutes: number = 15
  ): Promise<void> {
    const key = this.generateTokenKey(token);
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    await this.set(key, data, ttl);
  }

  async getTokenData(token: string): Promise<any> {
    const key = this.generateTokenKey(token);
    return await this.get(key);
  }

  async invalidateToken(token: string): Promise<void> {
    const key = this.generateTokenKey(token);
    await this.del(key);
  }
}

