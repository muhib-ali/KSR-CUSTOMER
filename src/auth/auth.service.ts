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
import { Role } from "../entities/role.entity";
import { CustomerToken } from "../entities/customer-token.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshDto } from "./dto/refresh.dto";
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
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(CustomerToken)
    private tokenRepository: Repository<CustomerToken>,
    private jwtService: JwtService,
    private cacheService: CacheService,
    private configService: AppConfigService
  ) {}

  private async resolveCustomerRoleId(): Promise<string> {
    const roleId = process.env.CUSTOMER_ROLE_ID;
    if (roleId) {
      return roleId;
    }

    const roleSlug = process.env.CUSTOMER_ROLE_SLUG || "customer";
    const role = await this.roleRepository.findOne({ where: { slug: roleSlug } });
    if (!role) {
      throw new BadRequestException(
        `Customer role not found (slug: ${roleSlug}). Set CUSTOMER_ROLE_ID or seed roles table.`
      );
    }

    return role.id;
  }

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

    const roleId = await this.resolveCustomerRoleId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = this.customerRepository.create({
      fullname,
      username,
      email,
      password: hashedPassword,
      phone: phone || null,
      role_id: roleId,
      is_email_verified: false,
      is_phone_verified: false,
    });

    const savedCustomer = await this.customerRepository.save(customer);
    const customerWithRole = await this.customerRepository.findOne({
      where: { id: savedCustomer.id },
      relations: ["role"],
    });

    if (!customerWithRole) {
      throw new BadRequestException("Customer registration failed");
    }

    const payload = { sub: customerWithRole.id, email: customerWithRole.email };
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
      customer_id: customerWithRole.id,
      name: `${customerWithRole.fullname} - ${new Date().toISOString()}`,
      token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      revoked: false,
    });
    await this.tokenRepository.save(tokenRecord);

    const tokenData = {
      customerId: customerWithRole.id,
      expires_at: expiresAt,
      revoked: false,
      customer: {
        id: customerWithRole.id,
        fullname: customerWithRole.fullname,
        username: customerWithRole.username,
        email: customerWithRole.email,
        role: customerWithRole.role,
      },
    };
    await this.cacheService.cacheTokenData(
      accessToken,
      tokenData,
      accessExpiresInMinutes
    );

    this.logger.log(`Customer registered successfully: ${customerWithRole.email}`);

    return ResponseHelper.success(
      {
        customer: {
          id: customerWithRole.id,
          fullname: customerWithRole.fullname,
          username: customerWithRole.username,
          email: customerWithRole.email,
          role: customerWithRole.role,
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
      relations: ["role"],
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
        role: customer.role,
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
          role: customer.role,
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
        relations: ["customer"],
      });

      if (!tokenRecord) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expires_at) {
        throw new UnauthorizedException("Token expired");
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

      // Update cache with new token
      const tokenData = {
        customerId: tokenRecord.customer_id,
        expires_at: newExpiresAt,
        revoked: false,
        customer: tokenRecord.customer,
      };
      await this.cacheService.cacheTokenData(
        newAccessToken,
        tokenData,
        accessExpiresInMinutes
      );

      this.logger.log(`Token refreshed for customer: ${tokenRecord.customer.email}`);

      return ResponseHelper.success(
        {
          token: newAccessToken,
          expires_at: newExpiresAt,
        },
        "Token refreshed successfully",
        "Authentication"
      );
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
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
        relations: ["customer", "customer.role"],
      });

      if (!tokenRecord) {
        return null;
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expires_at) {
        return null;
      }

      // Cache the valid token data for future requests
      const tokenData = {
        customerId: tokenRecord.customer_id,
        expires_at: tokenRecord.expires_at,
        revoked: tokenRecord.revoked,
        customer: tokenRecord.customer,
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

      return tokenRecord.customer;
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      return null;
    }
  }
}
