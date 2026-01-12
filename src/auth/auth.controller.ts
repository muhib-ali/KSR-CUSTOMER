import {
  Controller,
  Post,
  Get,
  Put,
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
import { EditProfileDto } from "./dto/edit-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

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
  @ApiOperation({ 
    summary: "User login",
    description: "Authenticate user with email and password"
  })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: "Login successful",
        heading: "Authentication",
        data: {
          customer: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            fullname: "John Doe",
            email: "john@example.com",
          },
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          expires_at: "2026-01-03T02:54:43.921Z"
        }
      }
    }
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
  @ApiBody({ 
    schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          format: "email",
          example: "john@example.com",
          description: "User email address"
        },
        password: {
          type: "string",
          format: "password",
          example: "Password@123",
          description: "User password"
        }
      },
      required: ["email", "password"]
    }
  })
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

  @Post("change-password")
  @ApiOperation({
    summary: "Change password",
    description: "Change the authenticated user's password by providing current password and a new password."
  })
  @ApiResponse({
    status: 200,
    description: "Password changed successfully",
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: "Password changed successfully",
        heading: "Authentication",
        data: null
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Current password incorrect or passwords do not match",
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: "Current password is incorrect",
        heading: "Error",
        data: null
      }
    }
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: ChangePasswordDto,
    description: "Change password request (authenticated)",
    examples: {
      standard: {
        summary: "Change password",
        value: {
          current_password: "OldPass123!",
          new_password: "NewSecurePass123!",
          confirm_password: "NewSecurePass123!"
        }
      }
    }
  })
  async changePassword(@Request() req, @Body(ValidationPipe) changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @Get("profile")
  @ApiOperation({ summary: "Get user profile" })
  @ApiResponse({
    status: 200,
    description: "Profile retrieved successfully",
    schema: {
      example: {
        status: true,
        message: "Profile retrieved successfully",
        heading: "Authentication",
        data: {
          id: "uuid",
          fullname: "John Doe",
          username: "johndoe",
          email: "john@example.com",
          phone: "+1234567890",
          is_email_verified: true,
          is_phone_verified: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Put("profile")
  @ApiOperation({ 
    summary: 'Edit user profile',
    description: 'Update the authenticated user\'s profile information. Only send the fields you want to update - all fields are optional. Email cannot be updated for security reasons.'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'Profile updated successfully',
        heading: 'Authentication',
        data: {
          id: "e261e7c4-6a8d-4357-bf59-99e4b39cdfa0",
          fullname: "John Updated Doe",
          username: "johndoe_updated",
          email: "john@example.com",
          phone: "+1234567890",
          is_email_verified: true,
          is_phone_verified: false,
          created_at: "2024-01-01T10:00:00.000Z",
          updated_at: "2024-01-06T18:00:00.000Z"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid data or validation errors',
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: 'Validation failed',
        heading: 'Error',
        data: {
          "fullname": 'Fullname must be at least 2 characters long',
          "username": 'Username must be at least 3 characters long',
          "phone": 'Phone number must be at least 10 characters long'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required or invalid',
    schema: {
      example: {
        statusCode: 401,
        status: false,
        message: 'Unauthorized',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - Username already exists',
    schema: {
      example: {
        statusCode: 409,
        status: false,
        message: 'Username already exists',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiBody({ 
    type: EditProfileDto,
    description: 'Profile update request. Only include fields you want to update. All fields are optional. Email cannot be updated for security reasons.',
    examples: {
      updateFullname: {
        summary: 'Update only fullname',
        value: {
          fullname: "John Updated Doe"
        }
      },
      updatePhone: {
        summary: 'Update only phone',
        value: {
          phone: "+1234567890"
        }
      },
      updateAll: {
        summary: 'Update all updatable fields',
        value: {
          fullname: "John Updated Doe",
          username: "johndoe_updated",
          phone: "+1234567890"
        }
      },
      updateUsername: {
        summary: 'Update only username',
        value: {
          username: "johndoe_updated"
        }
      }
    }
  })
  async editProfile(@Request() req, @Body(ValidationPipe) editProfileDto: EditProfileDto) {
    return this.authService.editProfile(req.user.id, editProfileDto);
  }
}
