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
import { SendPhoneOtpDto } from "./dto/send-phone-otp.dto";
import { VerifyPhoneOtpDto } from "./dto/verify-phone-otp.dto";
import { SendEmailVerificationDto } from "./dto/send-email-verification.dto";
import { VerifyEmailTokenDto } from "./dto/verify-email-token.dto";
import { CacheService } from "../cache/cache.service";
import { EmailService } from "../common/services/email.service";
import { v4 as uuidv4 } from 'uuid';
import { AppConfigService } from "../config/config.service";
import { ResponseHelper } from "../common/helpers/response.helper";
import { ApiResponse } from "../common/interfaces/api-response.interface";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Fallback in-memory storage for OTPs (temporary fix)
  private otpStorage: Map<string, { otp: string; expiresAt: number }> = new Map();
  private phoneVerificationStorage: Map<string, { verified: boolean; expiresAt: number }> = new Map();
  private emailVerificationStorage: Map<string, { email: string; verified: boolean; expiresAt: number }> = new Map();

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerToken)
    private tokenRepository: Repository<CustomerToken>,
    private jwtService: JwtService,
    private cacheService: CacheService,
    private configService: AppConfigService,
    private emailService: EmailService
  ) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<any>> {
    const { fullname, username, email, password, phone } = registerDto;

    // VALIDATIONS COMMENTED OUT FOR TESTING
    // 1.Check if email already exists
    // const existingEmail = await this.customerRepository.findOne({ where: { email } });
    // if (existingEmail) {
    //   throw new BadRequestException("Email already exists");
    // }

    // 2. Check if username already exists
    // const existingUsername = await this.customerRepository.findOne({ where: { username } });
    // if (existingUsername) {
    //   throw new BadRequestException("Username already exists");
    // }

    // 3. Check if email is verified
    // const verifiedEmailKey = `verified_email_${email}`;
    // this.logger.log(`Checking email verification for ${email} with key: ${verifiedEmailKey}`);
    
    // let emailVerificationData: any;
    
    // // Try cache first
    // try {
    //   const cachedData = await this.cacheService.get(verifiedEmailKey);
    //   if (cachedData) {
    //     emailVerificationData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
    //     this.logger.log(`Email verification status from cache: verified`);
    //   }
    // } catch (cacheError) {
    //   this.logger.warn(`Cache retrieval failed for email verification, using fallback: ${cacheError.message}`);
    // }
    
    // // Fallback to in-memory storage
    // if (!emailVerificationData) {
    //   const memoryData = this.emailVerificationStorage.get(verifiedEmailKey);
    //   if (memoryData && memoryData.expiresAt > Date.now() && memoryData.verified) {
    //     emailVerificationData = memoryData;
    //     this.logger.log(`Email verification status from fallback memory: verified`);
    //   } else if (memoryData) {
    //     this.logger.log(`Email verification expired in fallback memory`);
    //     this.emailVerificationStorage.delete(verifiedEmailKey);
    //   }
    // }
    
    // if (!emailVerificationData || !emailVerificationData.verified) {
    //   this.logger.error(`Email not verified: ${email}`);
    //   throw new BadRequestException("Please verify your email address before registering");
    // }

    // // Check if phone is verified (if phone is provided)
    // let isPhoneVerified = false;
    // if (phone) {
    //   const verifiedPhoneKey = `verified_phone_${phone}`;
    //   this.logger.log(`Checking phone verification for ${phone} with key: ${verifiedPhoneKey}`);
      
    //   let phoneVerificationStatus: boolean | undefined;
      
    //   // Try cache first
    //   try {
    //     phoneVerificationStatus = await this.cacheService.get(verifiedPhoneKey);
    //     this.logger.log(`Phone verification status from cache: ${phoneVerificationStatus}`);
    //   } catch (cacheError) {
    //     this.logger.warn(`Cache retrieval failed for phone verification, using fallback: ${cacheError.message}`);
    //   }
      
    //   // Fallback to in-memory storage
    //   if (!phoneVerificationStatus) {
    //     const memoryData = this.phoneVerificationStorage.get(verifiedPhoneKey);
    //     if (memoryData && memoryData.expiresAt > Date.now()) {
    //       phoneVerificationStatus = memoryData.verified;
    //       this.logger.log(`Phone verification status from fallback memory: ${phoneVerificationStatus}`);
    //     } else if (memoryData) {
    //       this.logger.log(`Phone verification expired in fallback memory`);
    //       this.phoneVerificationStorage.delete(verifiedPhoneKey);
    //     }
    //   }
      
    //   if (!phoneVerificationStatus) {
    //     this.logger.error(`Phone not verified: ${phone}`);
    //     throw new BadRequestException("Please verify your phone number before registering");
    //   }
      
    //   isPhoneVerified = true;
    //   // Remove the verification status from cache after successful registration
    //   this.logger.log(`Removing phone verification from cache: ${verifiedPhoneKey}`);
    //   try {
    //     await this.cacheService.del(verifiedPhoneKey);
    //   } catch (cacheError) {
    //     this.logger.warn(`Cache delete failed for phone verification: ${cacheError.message}`);
    //   }
    //   this.phoneVerificationStorage.delete(verifiedPhoneKey);
    // }

    // // Remove email verification from cache after successful registration
    // this.logger.log(`Removing email verification from cache: ${verifiedEmailKey}`);
    // try {
    //   await this.cacheService.del(verifiedEmailKey);
    // } catch (cacheError) {
    //   this.logger.warn(`Cache delete failed for email verification: ${cacheError.message}`);
    // }
    // this.emailVerificationStorage.delete(verifiedEmailKey);
    // END OF COMMENTED VALIDATIONS

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
      is_email_verified: true, // Set to true for testing
      // is_phone_verified: isPhoneVerified,
      is_phone_verified: false, // Set to false for testing
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

  async sendPhoneOtp(sendPhoneOtpDto: SendPhoneOtpDto): Promise<ApiResponse<any>> {
    const { phone } = sendPhoneOtpDto;

    try {
      // Generate a 6-digit OTP for testing (in production, use a proper SMS service)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in cache with 5 minutes expiration
      const cacheKey = `phone_otp_${phone}`;
      this.logger.log(`Storing OTP for phone ${phone} with key: ${cacheKey}`);
      
      // Try cache first
      try {
        await this.cacheService.set(cacheKey, otp, 300); // 5 minutes
      } catch (cacheError) {
        this.logger.warn(`Cache storage failed, using fallback: ${cacheError.message}`);
      }
      
      // Fallback to in-memory storage
      const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
      this.otpStorage.set(cacheKey, { otp, expiresAt });
      this.logger.log(`OTP stored in fallback memory for phone ${phone}`);

      // For testing purposes, return the OTP in response
      // In production, you would send this via SMS service
      this.logger.log(`OTP for phone ${phone}: ${otp}`);

      return ResponseHelper.success(
        { otp }, // Only for testing, remove in production
        "OTP sent successfully",
        "Phone Verification"
      );
    } catch (error) {
      this.logger.error(`Send phone OTP error: ${error.message}`);
      throw new BadRequestException("Failed to send OTP");
    }
  }

  async verifyPhoneOtp(verifyPhoneOtpDto: VerifyPhoneOtpDto): Promise<ApiResponse<any>> {
    const { phone, otp } = verifyPhoneOtpDto;

    try {
      // Get OTP from cache
      const cacheKey = `phone_otp_${phone}`;
      this.logger.log(`Trying to retrieve OTP for phone ${phone} with key: ${cacheKey}`);
      
      let storedOtp: string | undefined;
      
      // Try cache first
      try {
        storedOtp = await this.cacheService.get(cacheKey);
        this.logger.log(`Retrieved OTP from cache: ${storedOtp}`);
      } catch (cacheError) {
        this.logger.warn(`Cache retrieval failed, using fallback: ${cacheError.message}`);
      }
      
      // Fallback to in-memory storage
      if (!storedOtp) {
        const memoryData = this.otpStorage.get(cacheKey);
        if (memoryData && memoryData.expiresAt > Date.now()) {
          storedOtp = memoryData.otp;
          this.logger.log(`Retrieved OTP from fallback memory: ${storedOtp}`);
        } else if (memoryData) {
          this.logger.log(`OTP expired in fallback memory`);
          this.otpStorage.delete(cacheKey);
        }
      }

      if (!storedOtp) {
        this.logger.error(`OTP not found for key: ${cacheKey}`);
        throw new BadRequestException("OTP expired or not found");
      }

      if (storedOtp !== otp) {
        this.logger.error(`OTP mismatch. Expected: ${storedOtp}, Received: ${otp}`);
        throw new BadRequestException("Invalid OTP");
      }

      // Mark this phone as verified in cache for registration (not in database yet)
      // The actual is_phone_verified will be set during registration
      const verifiedPhoneKey = `verified_phone_${phone}`;
      this.logger.log(`Marking phone as verified with key: ${verifiedPhoneKey}`);
      
      // Try cache first
      try {
        await this.cacheService.set(verifiedPhoneKey, true, 600); // 10 minutes for registration
      } catch (cacheError) {
        this.logger.warn(`Cache storage failed for verification, using fallback: ${cacheError.message}`);
      }
      
      // Fallback to in-memory storage
      const verificationExpiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
      this.phoneVerificationStorage.set(verifiedPhoneKey, { verified: true, expiresAt: verificationExpiresAt });

      // Remove OTP from cache after successful verification
      this.logger.log(`Removing OTP from cache: ${cacheKey}`);
      try {
        await this.cacheService.del(cacheKey);
      } catch (cacheError) {
        this.logger.warn(`Cache delete failed: ${cacheError.message}`);
      }
      this.otpStorage.delete(cacheKey);

      return ResponseHelper.success(
        { is_phone_verified: true, phone_verified_for_registration: true },
        "Phone number verified successfully. You can now complete registration.",
        "Phone Verification"
      );
    } catch (error) {
      this.logger.error(`Verify phone OTP error: ${error.message}`);
      throw error;
    }
  }

  async sendEmailVerification(sendEmailVerificationDto: SendEmailVerificationDto): Promise<ApiResponse<any>> {
    const { email } = sendEmailVerificationDto;

    try {
      // Check if email already exists in database
      const existingCustomer = await this.customerRepository.findOne({ where: { email } });
      if (existingCustomer) {
        throw new BadRequestException("Email already registered");
      }

      // Generate unique verification token
      const verificationToken = uuidv4();
      
      // Store token in cache with 10 minutes expiration
      const cacheKey = `email_verification_token_${verificationToken}`;
      this.logger.log(`Storing verification token for email ${email} with key: ${cacheKey}`);
      
      const tokenData = {
        email,
        verified: false,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
      };

      // Try cache first
      try {
        await this.cacheService.set(cacheKey, JSON.stringify(tokenData), 600); // 10 minutes
      } catch (cacheError) {
        this.logger.warn(`Cache storage failed, using fallback: ${cacheError.message}`);
      }
      
      // Fallback to in-memory storage
      this.emailVerificationStorage.set(cacheKey, tokenData);
      this.logger.log(`Verification token stored in fallback memory for email ${email}`);

      // Send verification email via Mailtrap
      await this.emailService.sendVerificationEmail(email, verificationToken);

      return ResponseHelper.success(
        { 
          message: "Verification email sent",
          email: email 
        },
        "Please check your email and click the verification link",
        "Email Verification"
      );
    } catch (error) {
      this.logger.error(`Send email verification error: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Failed to send verification email");
    }
  }

  async verifyEmailToken(verifyEmailTokenDto: VerifyEmailTokenDto): Promise<ApiResponse<any>> {
    const { token } = verifyEmailTokenDto;

    try {
      // Get token data from cache
      const cacheKey = `email_verification_token_${token}`;
      this.logger.log(`Trying to retrieve verification token: ${cacheKey}`);
      
      let tokenData: any;
      
      // Try cache first
      try {
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
          tokenData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
          this.logger.log(`Retrieved token from cache`);
        }
      } catch (cacheError) {
        this.logger.warn(`Cache retrieval failed, using fallback: ${cacheError.message}`);
      }
      
      // Fallback to in-memory storage
      if (!tokenData) {
        const memoryData = this.emailVerificationStorage.get(cacheKey);
        if (memoryData && memoryData.expiresAt > Date.now()) {
          tokenData = memoryData;
          this.logger.log(`Retrieved token from fallback memory`);
        } else if (memoryData) {
          this.logger.log(`Token expired in fallback memory`);
          this.emailVerificationStorage.delete(cacheKey);
        }
      }

      if (!tokenData) {
        this.logger.error(`Token not found or expired: ${cacheKey}`);
        throw new BadRequestException("Verification link expired or invalid");
      }

      if (tokenData.expiresAt < Date.now()) {
        this.logger.error(`Token expired`);
        // Clean up expired token
        try {
          await this.cacheService.del(cacheKey);
        } catch (e) {}
        this.emailVerificationStorage.delete(cacheKey);
        throw new BadRequestException("Verification link has expired");
      }

      // Mark email as verified
      const verifiedEmailKey = `verified_email_${tokenData.email}`;
      this.logger.log(`Marking email as verified with key: ${verifiedEmailKey}`);
      
      const verifiedData = {
        email: tokenData.email,
        verified: true,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes to complete registration
      };

      // Try cache first
      try {
        await this.cacheService.set(verifiedEmailKey, JSON.stringify(verifiedData), 600); // 10 minutes
      } catch (cacheError) {
        this.logger.warn(`Cache storage failed for verification, using fallback: ${cacheError.message}`);
      }
      
      // Fallback to in-memory storage
      this.emailVerificationStorage.set(verifiedEmailKey, verifiedData);

      // Remove verification token from cache
      this.logger.log(`Removing verification token from cache: ${cacheKey}`);
      try {
        await this.cacheService.del(cacheKey);
      } catch (cacheError) {
        this.logger.warn(`Cache delete failed: ${cacheError.message}`);
      }
      this.emailVerificationStorage.delete(cacheKey);

      return ResponseHelper.success(
        { 
          is_email_verified: true,
          email: tokenData.email,
          email_verified_for_registration: true 
        },
        "Email verified successfully! You can now complete your registration.",
        "Email Verification"
      );
    } catch (error) {
      this.logger.error(`Verify email token error: ${error.message}`);
      throw error;
    }
  }
}
