import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { LoginResponseDto } from "./dto/login-response.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "User registration" })
  @ApiResponse({
    status: 201,
    description: "Registration successful",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @ApiBody({ type: RegisterDto })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registration attempts per minute
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @ApiOperation({ summary: "User login" })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials",
    schema: {
      example: {
        statusCode: 401,
        status: false,
        message: "Invalid credentials",
        heading: "Authentication",
        data: null,
      },
    },
  })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @ApiBody({ type: LoginDto })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
    schema: {
      example: {
        status: true,
        message: "Token refreshed successfully",
        heading: "Authentication",
        data: {
          token: "new-jwt-access-token",
          expires_at: "2024-01-01T00:15:00.000Z",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @ApiBody({ type: RefreshDto })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refresh attempts per minute
  async refresh(@Body(ValidationPipe) refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto);
  }

  @Post("logout")
  @ApiOperation({ summary: "User logout" })
  @ApiResponse({
    status: 200,
    description: "Logout successful",
    schema: {
      example: {
        status: true,
        message: "Logged out successfully",
        heading: "Authentication",
        data: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(" ")[1];
    return this.authService.logout(token);
  }
}
