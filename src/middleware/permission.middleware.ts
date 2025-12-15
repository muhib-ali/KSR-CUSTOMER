import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RolePermission } from "../entities/role-permission.entity";
import { User } from "../entities/user.entity";
import { OauthToken } from "../entities/oauth-token.entity";
import { CacheService } from "../cache/cache.service";
import { AppConfigService } from "../config/config.service";
import * as jwt from "jsonwebtoken";

@Injectable()
export class PermissionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PermissionMiddleware.name);

  constructor(
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OauthToken)
    private tokenRepository: Repository<OauthToken>,
    private cacheService: CacheService,
    private configService: AppConfigService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Get the full path for route parsing
      const fullPath = req.originalUrl || req.baseUrl + req.path;
      const url = new URL(fullPath, `http://${req.get("host")}`);
      const pathname = url.pathname;

      // Extract and validate token
      const token = this.extractTokenFromHeader(req);
      if (!token) {
        throw new UnauthorizedException("Authentication token required");
      }
      // Skip excluded routes (auth, health, API docs)
      if (this.isExcludedRoute(pathname)) {
        return next();
      }

      // Verify JWT token
      const decoded = this.verifyToken(token);

      // Validate token exists in database (not revoked/deleted)
      const isValidToken = await this.validateTokenInDatabase(token);
      if (!isValidToken) {
        throw new UnauthorizedException("Token has been revoked or expired");
      }

      // Get user with role (with caching)
      const user = await this.getUserWithRole(decoded.sub);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      // Extract route information
      const { moduleSlug, permissionSlug } = this.extractRouteInfo(pathname);
      if (!moduleSlug || !permissionSlug) {
        throw new ForbiddenException("Invalid route format");
      }

      // Check permission (with caching)
      const hasPermission = await this.checkPermissionCached(
        user.role.id,
        moduleSlug,
        permissionSlug
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Access denied: Insufficient permissions for ${moduleSlug}/${permissionSlug}`
        );
      }

      // Attach user to request for controllers
      (req as any).user = user;
      next();
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Permission middleware error: ${error.message}`);
      throw new ForbiddenException("Access denied");
    }
  }

  private isExcludedRoute(pathname: string): boolean {
    const excludedPaths = ["/auth", "/health", "/api"];
    return excludedPaths.some((path) => pathname.startsWith(path));
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }

  private verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.configService.jwtSecret);
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private async validateTokenInDatabase(token: string): Promise<boolean> {
    try {
      const tokenRecord = await this.tokenRepository.findOne({
        where: {
          token,
          revoked: false,
        },
      });

      if (!tokenRecord) {
        return false;
      }

      // Check if token is expired
      if (tokenRecord.expires_at < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Database token validation error: ${error.message}`);
      return false;
    }
  }

  private async getUserWithRole(userId: string): Promise<User | null> {
    const cacheKey = `user:${userId}`;

    // Try to get from cache first
    const cachedUser = await this.cacheService.get(cacheKey);
    if (cachedUser && typeof cachedUser === "string") {
      return JSON.parse(cachedUser);
    }

    // Get from database
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["role"],
    });

    // Cache for 5 minutes
    if (user) {
      await this.cacheService.set(cacheKey, JSON.stringify(user), 300);
    }

    return user;
  }

  private extractRouteInfo(path: string): {
    moduleSlug: string | null;
    permissionSlug: string | null;
  } {
    // Remove leading slash and split path
    const pathParts = path.replace(/^\//, "").split("/");

    if (pathParts.length < 2) {
      return { moduleSlug: null, permissionSlug: null };
    }

    const moduleSlug = pathParts[0]; // e.g., "roles", "modules", "users"
    const permissionSlug = pathParts[1]; // e.g., "create", "update", "getById", "abcd", "bjsda"

    // Dynamic handling - whatever comes after the module is the permission slug
    // Examples:
    // /roles/create → moduleSlug: "roles", permissionSlug: "create"
    // /roles/getById/uuid → moduleSlug: "roles", permissionSlug: "getById"
    // /roles/abcd/uuid → moduleSlug: "roles", permissionSlug: "abcd"
    // /roles/bjsda/uuid → moduleSlug: "roles", permissionSlug: "bjsda"

    return { moduleSlug, permissionSlug };
  }

  private async checkPermissionCached(
    roleId: string,
    moduleSlug: string,
    permissionSlug: string
  ): Promise<boolean> {
    const cacheKey = `permission:${roleId}:${moduleSlug}:${permissionSlug}`;

    // Try to get from cache first
    const cachedPermission = await this.cacheService.get(cacheKey);
    if (
      cachedPermission !== undefined &&
      typeof cachedPermission === "string"
    ) {
      return cachedPermission === "true";
    }

    // Get from database with optimized query using indexes
    try {
      const permission = await this.rolePermissionRepository.findOne({
        where: {
          role_id: roleId,
          module_slug: moduleSlug,
          permission_slug: permissionSlug,
          is_allowed: true,
        },
        select: ["id"], // Only select id field for better performance
      });

      const hasPermission = !!permission;

      // Cache result for 10 minutes
      await this.cacheService.set(cacheKey, hasPermission.toString(), 600);

      return hasPermission;
    } catch (error) {
      this.logger.error(
        `Database error checking permission for role ${roleId}, ${moduleSlug}/${permissionSlug}: ${error.message}`
      );
      return false; // Deny access on database errors
    }
  }
}
