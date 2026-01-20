import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Customer } from "../entities/customer.entity";
import { CustomerToken } from "../entities/customer-token.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { EditProfileDto } from "./dto/edit-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CacheService } from "../cache/cache.service";
import { AppConfigService } from "../config/config.service";
import { ResponseHelper } from "../common/helpers/response.helper";
import { ApiResponse } from "../common/interfaces/api-response.interface";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerToken)
    private tokenRepository: Repository<CustomerToken>,
    private jwtService: JwtService,
    private cacheService: CacheService,
    private configService: AppConfigService
  ) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<any>> {
    const { fullname, username, email, password, phone } = registerDto;

    // Check if email already exists
    const existingEmail = await this.customerRepository.findOne({ where: { email } });
    if (existingEmail) {
      throw new BadRequestException("Email already exists");
    }

    // Check if username already exists
    const existingUsername = await this.customerRepository.findOne({ where: { username } });
    if (existingUsername) {
      throw new BadRequestException("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Assign default role_id (shared DB uses roles table)
    const roleRows = await this.customerRepository.manager.query(
      `SELECT id FROM roles WHERE slug = $1 LIMIT 1`,
      ['customer']
    );
    const customerRoleId = roleRows?.[0]?.id as string | undefined;
    if (!customerRoleId) {
      throw new BadRequestException('Customer role not found. Please seed roles and try again.');
    }

    const customer = this.customerRepository.create({
      fullname,
      username,
      email,
      password: hashedPassword,
      role_id: customerRoleId,
      phone: phone || null,
      is_email_verified: false,
      is_phone_verified: false,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    const payload = { sub: savedCustomer.id, email: savedCustomer.email };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.jwtAccessExpires,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.jwtRefreshExpires,
    });

    const expiresAt = new Date();
    const accessExpiresInMinutes = this.configService.jwtAccessExpiresMinutes;
    expiresAt.setMinutes(expiresAt.getMinutes() + accessExpiresInMinutes);

    const tokenRecord = this.tokenRepository.create({
      customer_id: savedCustomer.id,
      name: `${savedCustomer.fullname} - ${new Date().toISOString()}`,
      token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      revoked: false,
    });
    await this.tokenRepository.save(tokenRecord);

    const tokenData = {
      customerId: savedCustomer.id,
      expires_at: expiresAt,
      revoked: false,
      customer: {
        id: savedCustomer.id,
        fullname: savedCustomer.fullname,
        username: savedCustomer.username,
        email: savedCustomer.email,
      },
    };
    await this.cacheService.cacheTokenData(
      accessToken,
      tokenData,
      accessExpiresInMinutes
    );

    this.logger.log(`Customer registered successfully: ${savedCustomer.email}`);

    return ResponseHelper.success(
      {
        customer: {
          id: savedCustomer.id,
          fullname: savedCustomer.fullname,
          username: savedCustomer.username,
          email: savedCustomer.email,
        },
        token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
      "Registration successful",
      "Authentication",
      201
    );
  }

  async login(loginDto: LoginDto): Promise<ApiResponse<any>> {
    const { email, password } = loginDto;

    // Find customer by email
    const customer = await this.customerRepository.findOne({
      where: { email },
    });

    if (!customer) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate tokens
    const payload = { sub: customer.id, email: customer.email };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.jwtAccessExpires,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.jwtRefreshExpires,
    });

    // Calculate expiry date
    const expiresAt = new Date();
    const accessExpiresInMinutes = this.configService.jwtAccessExpiresMinutes;
    expiresAt.setMinutes(expiresAt.getMinutes() + accessExpiresInMinutes);

    // Save token to database
    const tokenRecord = this.tokenRepository.create({
      customer_id: customer.id,
      name: `${customer.fullname} - ${new Date().toISOString()}`,
      token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      revoked: false,
    });

    await this.tokenRepository.save(tokenRecord);

    // Cache token data for faster validation
    const tokenData = {
      customerId: customer.id,
      expires_at: expiresAt,
      revoked: false,
      customer: {
        id: customer.id,
        fullname: customer.fullname,
        username: customer.username,
        email: customer.email,
      },
    };
    await this.cacheService.cacheTokenData(
      accessToken,
      tokenData,
      accessExpiresInMinutes
    );

    this.logger.log(`Customer logged in successfully: ${customer.email}`);

    // Return response (no RBAC permissions for customer portal)
    return ResponseHelper.success(
      {
        customer: {
          id: customer.id,
          fullname: customer.fullname,
          username: customer.username,
          email: customer.email,
        },
        token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
      "Login successful",
      "Authentication"
    );
  }

  async refresh(refreshDto: RefreshDto): Promise<ApiResponse<any>> {
    const { refresh_token } = refreshDto;

    if (!refresh_token) {
      throw new UnauthorizedException("Refresh token is required");
    }

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refresh_token);

      // Find token record in database
      const tokenRecord = await this.tokenRepository.findOne({
        where: {
          refresh_token,
          customer_id: payload.sub,
          revoked: false,
        },
      });

      if (!tokenRecord) {
        this.logger.warn(`Token not found in DB for customer: ${payload.sub}`);
        throw new UnauthorizedException("Invalid or expired refresh token. Please login again.");
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expires_at) {
        this.logger.warn(`Token expired for customer: ${payload.sub}`);
        throw new UnauthorizedException("Refresh token expired. Please login again.");
      }

      // Generate new access token
      const newPayload = { sub: payload.sub, email: payload.email };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.jwtAccessExpires,
      });

      // Calculate new expiry date
      const newExpiresAt = new Date();
      const accessExpiresInMinutes = this.configService.jwtAccessExpiresMinutes;
      newExpiresAt.setMinutes(
        newExpiresAt.getMinutes() + accessExpiresInMinutes
      );

      // Update token record
      tokenRecord.token = newAccessToken;
      tokenRecord.expires_at = newExpiresAt;
      await this.tokenRepository.save(tokenRecord);

      // Get customer for cache
      const customer = await this.customerRepository.findOne({
        where: { id: tokenRecord.customer_id },
      });

      // Update cache with new token
      const tokenData = {
        customerId: tokenRecord.customer_id,
        expires_at: newExpiresAt,
        revoked: false,
        customer: customer,
      };
      await this.cacheService.cacheTokenData(
        newAccessToken,
        tokenData,
        accessExpiresInMinutes
      );

      this.logger.log(`Token refreshed for customer: ${customer?.email || "unknown"}`);

      return ResponseHelper.success(
        {
          token: newAccessToken,
          expires_at: newExpiresAt,
        },
        "Token refreshed successfully",
        "Authentication"
      );
    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`);
      
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException("Invalid refresh token format. Please login again.");
      } else if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException("Refresh token expired. Please login again.");
      } else if (error instanceof UnauthorizedException) {
        throw error; // Re-throw our custom errors
      } else {
        throw new UnauthorizedException("Token refresh failed. Please login again.");
      }
    }
  }

  async debugRefreshToken(refresh_token: string): Promise<ApiResponse<any>> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refresh_token);
      
      // Find token record in database
      const tokenRecord = await this.tokenRepository.findOne({
        where: {
          refresh_token,
          customer_id: payload.sub,
          revoked: false,
        },
      });

      return ResponseHelper.success({
        token_valid: true,
        payload: {
          sub: payload.sub,
          email: payload.email,
          exp: payload.exp,
          iat: payload.iat,
        },
        token_record: tokenRecord ? {
          id: tokenRecord.id,
          customer_id: tokenRecord.customer_id,
          expires_at: tokenRecord.expires_at,
          revoked: tokenRecord.revoked,
          created_at: tokenRecord.created_at,
        } : null,
        is_expired: tokenRecord ? new Date() > tokenRecord.expires_at : null,
      }, "Token debug information", "Debug");
    } catch (error) {
      return ResponseHelper.success({
        token_valid: false,
        error: error.message,
        error_name: error.name,
      }, "Token debug information", "Debug");
    }
  }

  async logout(token: string): Promise<ApiResponse<null>> {
    // Find and delete token record
    const tokenRecord = await this.tokenRepository.findOne({
      where: { token },
      relations: ["customer"],
    });

    if (tokenRecord) {
      await this.tokenRepository.remove(tokenRecord);
      // Invalidate cache
      await this.cacheService.invalidateToken(token);
      this.logger.log(
        `Customer logged out: ${tokenRecord.customer?.email || "unknown"}`
      );
    }

    return ResponseHelper.success(
      null,
      "Logged out successfully",
      "Authentication"
    );
  }

  async validateToken(token: string, customerId: string): Promise<Customer | null> {
    try {
      // First check cache for faster validation
      const cachedData = await this.cacheService.getTokenData(token);

      if (cachedData) {
        // Check if cached token is still valid
        if (
          cachedData.customerId === customerId &&
          !cachedData.revoked &&
          new Date() < new Date(cachedData.expires_at)
        ) {
          return cachedData.customer;
        } else {
          // Invalid cached data, remove it
          await this.cacheService.invalidateToken(token);
        }
      }

      // Fallback to database with optimized query
      const tokenRecord = await this.tokenRepository.findOne({
        where: {
          token,
          customer_id: customerId,
          revoked: false,
        },
        select: ["id", "expires_at", "revoked", "customer_id"],
      });

      if (!tokenRecord) {
        return null;
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expires_at) {
        return null;
      }

      // Get customer data
      const customer = await this.customerRepository.findOne({
        where: { id: tokenRecord.customer_id },
      });

      if (!customer) {
        return null;
      }

      // Cache the valid token data for future requests
      const tokenData = {
        customerId: tokenRecord.customer_id,
        expires_at: tokenRecord.expires_at,
        revoked: tokenRecord.revoked,
        customer: customer,
      };

      const remainingMinutes = Math.floor(
        (tokenRecord.expires_at.getTime() - new Date().getTime()) / (1000 * 60)
      );

      if (remainingMinutes > 0) {
        await this.cacheService.cacheTokenData(
          token,
          tokenData,
          remainingMinutes
        );
      }

      return customer;
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      return null;
    }
  }

  async getProfile(customerId: string): Promise<ApiResponse<any>> {
    try {
      const customer = await this.customerRepository.findOne({ 
        where: { id: customerId },
        select: ['id', 'fullname', 'username', 'email', 'phone', 'is_email_verified', 'is_phone_verified', 'created_at', 'updated_at']
      });

      if (!customer) {
        throw new UnauthorizedException("Customer not found");
      }

      return ResponseHelper.success(
        customer,
        "Profile retrieved successfully",
        "Authentication"
      );
    } catch (error) {
      this.logger.error(`Get profile error: ${error.message}`);
      throw error;
    }
  }

  async editProfile(customerId: string, editProfileDto: EditProfileDto): Promise<ApiResponse<any>> {
    try {
      const customer = await this.customerRepository.findOne({ 
        where: { id: customerId }
      });

      if (!customer) {
        throw new UnauthorizedException("Customer not found");
      }

      const { fullname, username, phone } = editProfileDto;

      // Check if username already exists (if username is being updated)
      if (username && username !== customer.username) {
        const existingUsername = await this.customerRepository.findOne({ where: { username } });
        if (existingUsername) {
          throw new BadRequestException("Username already exists");
        }
      }

      // Update customer fields
      if (fullname) customer.fullname = fullname;
      if (username) customer.username = username;
      if (phone) customer.phone = phone;

      const updatedCustomer = await this.customerRepository.save(customer);

      // Return updated customer without password
      const { password, ...customerWithoutPassword } = updatedCustomer;

      return ResponseHelper.success(
        customerWithoutPassword,
        "Profile updated successfully",
        "Authentication"
      );
    } catch (error) {
      this.logger.error(`Edit profile error: ${error.message}`);
      throw error;
    }
  }

  async changePassword(customerId: string, changePasswordDto: ChangePasswordDto): Promise<ApiResponse<null>> {
    const { current_password, new_password, confirm_password } = changePasswordDto;

    if (new_password !== confirm_password) {
      throw new BadRequestException("Passwords do not match");
    }

    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new UnauthorizedException("Customer not found");
    }

    const isPasswordValid = await bcrypt.compare(current_password, customer.password);
    if (!isPasswordValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await this.customerRepository.update(customer.id, {
      password: hashedPassword,
      updated_at: new Date(),
    });

    return ResponseHelper.success(
      null,
      "Password changed successfully",
      "Authentication"
    );
  }
}
