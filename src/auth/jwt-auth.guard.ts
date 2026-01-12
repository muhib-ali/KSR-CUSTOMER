import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log("JWT Guard - Auth Header:", authHeader);
    
    if (!authHeader) {
      console.log("JWT Guard - No auth header found");
      throw new UnauthorizedException("No token provided");
    }
    
    const [type, token] = authHeader.split(" ") ?? [];
    console.log("JWT Guard - Type:", type, "Token Length:", token?.length);
    
    if (type !== "Bearer" || !token) {
      console.log("JWT Guard - Invalid auth format");
      throw new UnauthorizedException("Invalid token format");
    }

    try {
      const payload = this.jwtService.verify(token);
      console.log("JWT Guard - Token verified successfully");
      
      const customer = await this.authService.validateToken(token, payload.sub);
      console.log("JWT Guard - Customer validation:", customer ? "success" : "failed");
      
      if (!customer) {
        throw new UnauthorizedException("Invalid token");
      }

      request.user = customer;
      return true;
    } catch (error) {
      console.log("JWT Guard - Verification failed:", error.message);
      throw new UnauthorizedException("Invalid token");
    }
  }
}
