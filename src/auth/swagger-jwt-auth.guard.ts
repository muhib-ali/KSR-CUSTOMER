import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import * as jwt from "jsonwebtoken";

@Injectable()
export class SwaggerJwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      // Verify JWT token manually
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as any;

      // Validate token in database
      const customer = await this.authService.validateToken(token, payload.sub);

      if (!customer) {
        throw new UnauthorizedException("Invalid token");
      }

      // Attach customer to request
      request.user = customer;
      return true;
    } catch (error) {
      console.log("Swagger JWT Guard Error:", error.message);
      throw new UnauthorizedException("Invalid token");
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    console.log("Swagger JWT Guard - Auth Header:", authHeader);
    
    if (!authHeader) {
      return undefined;
    }
    
    // Handle both "Bearer token" and just "token" formats
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log("Swagger JWT Guard - Bearer Token Length:", token.length);
      return token;
    } else {
      // Swagger might send just the token without "Bearer" prefix
      console.log("Swagger JWT Guard - Direct Token Length:", authHeader.length);
      return authHeader;
    }
  }
}
