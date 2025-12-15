import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import * as jwt from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard implements CanActivate {
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
      throw new UnauthorizedException("Invalid token");
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
