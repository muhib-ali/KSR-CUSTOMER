import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ResponseHelper } from '../common/helpers/response.helper';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { Customer } from '../entities/customer.entity';
import { PasswordReset, PasswordResetStatus } from '../entities/password-reset.entity';
import { Otp, OtpType, OtpStatus } from '../entities/otp.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordWithOtpDto } from './dto/forgot-password-with-otp.dto';
import { ResetPasswordWithOtpDto } from './dto/reset-password-with-otp.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthExtendedService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  // Forgot Password - Send reset link
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponse<any>> {
    const { email } = forgotPasswordDto;

    // Check if customer exists
    const customer = await this.customerRepository.findOne({
      where: { email, is_active: true }
    });

    if (!customer) {
      // Don't reveal if email exists or not for security
      return ResponseHelper.success(
        null,
        'If an account with this email exists, a password reset link has been sent',
        'Password Reset'
      );
    }

    // Generate secure reset token
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Invalidate any existing reset tokens for this customer
    await this.passwordResetRepository.update(
      { customer_id: customer.id },
      { status: PasswordResetStatus.EXPIRED }
    );

    // Create new password reset record
    const passwordReset = this.passwordResetRepository.create({
      id: uuidv4(),
      customer_id: customer.id,
      token: resetToken,
      status: PasswordResetStatus.PENDING,
      expires_at: expiresAt,
    });

    await this.passwordResetRepository.save(passwordReset);

    // Send reset email (in production, use proper email service)
    try {
      await this.sendPasswordResetEmail(email, resetToken, customer.fullname);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't fail the request if email fails
    }

    return ResponseHelper.success(
      null,
      'If an account with this email exists, a password reset link has been sent',
      'Password Reset'
    );
  }

  // Reset Password
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ApiResponse<any>> {
    const { token, new_password, confirm_password } = resetPasswordDto;

    // Validate passwords match
    if (new_password !== confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find valid reset token
    const passwordReset = await this.passwordResetRepository.findOne({
      where: {
        token,
        status: PasswordResetStatus.PENDING,
        expires_at: MoreThan(new Date())
      },
      relations: ['customer']
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(new_password);

    // Update customer password
    await this.customerRepository.update(passwordReset.customer_id, {
      password: hashedPassword,
      updated_at: new Date()
    });

    // Mark reset token as used
    await this.passwordResetRepository.update(passwordReset.id, {
      status: PasswordResetStatus.USED,
      used_at: new Date(),
      updated_at: new Date()
    });

    return ResponseHelper.success(
      null,
      'Password reset successfully',
      'Password Reset'
    );
  }

  // Send OTP
  async sendOtp(sendOtpDto: SendOtpDto): Promise<ApiResponse<any>> {
    const { type, recipient } = sendOtpDto;

    // Find customer by email or phone
    let customer: Customer;
    if (type === OtpType.EMAIL_VERIFICATION || type === OtpType.PASSWORD_RESET) {
      customer = await this.customerRepository.findOne({
        where: { email: recipient, is_active: true }
      });
    } else {
      customer = await this.customerRepository.findOne({
        where: { phone: recipient, is_active: true }
      });
    }

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Invalidate existing OTPs for this customer and type
    await this.otpRepository.update(
      { customer_id: customer.id, type },
      { status: OtpStatus.EXPIRED }
    );

    // Create new OTP record
    const otp = this.otpRepository.create({
      id: uuidv4(),
      customer_id: customer.id,
      token: otpCode,
      type,
      status: OtpStatus.PENDING,
      expires_at: expiresAt,
      recipient,
      attempts: 0
    });

    await this.otpRepository.save(otp);

    // Send OTP (email or SMS)
    try {
      if (type === OtpType.EMAIL_VERIFICATION || type === OtpType.PASSWORD_RESET) {
        await this.sendOtpEmail(recipient, otpCode, customer.fullname, type);
      } else {
        await this.sendOtpSms(recipient, otpCode, type);
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
      throw new InternalServerErrorException('Failed to send OTP');
    }

    const isProd = process.env.NODE_ENV === 'production';

    return ResponseHelper.success(
      isProd
        ? null
        : {
            otp: otpCode,
            expires_at: expiresAt,
            recipient,
            type,
          },
      'OTP sent successfully',
      'OTP'
    );
  }

  // Verify OTP
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<ApiResponse<any>> {
    const { token, type, recipient } = verifyOtpDto;

    // Find valid OTP
    const otp = await this.otpRepository.findOne({
      where: {
        token,
        type,
        recipient,
        status: OtpStatus.PENDING,
        expires_at: MoreThan(new Date())
      },
      relations: ['customer']
    });

    if (!otp) {
      // Increment attempts for invalid OTP attempts
      await this.otpRepository.increment(
        { token, type, recipient },
        'attempts',
        1
      );
      
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await this.otpRepository.update(otp.id, {
      status: OtpStatus.USED,
      used_at: new Date(),
      updated_at: new Date()
    });

    // Handle specific OTP types
    if (type === OtpType.EMAIL_VERIFICATION) {
      await this.customerRepository.update(otp.customer_id, {
        is_email_verified: true,
        updated_at: new Date()
      });
    } else if (type === OtpType.PHONE_VERIFICATION) {
      await this.customerRepository.update(otp.customer_id, {
        is_phone_verified: true,
        updated_at: new Date()
      });
    } else if (type === OtpType.PASSWORD_RESET) {
      // Special case for password reset OTP
      return ResponseHelper.success(
        { 
          verified: true,
          customer_id: otp.customer_id,
          reset_session: uuidv4(), // Create session token for password reset
          expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
          can_reset_password: true
        },
        'OTP verified successfully. You can now reset your password.',
        'Password Reset'
      );
    }

    return ResponseHelper.success(
      { verified: true, customer_id: otp.customer_id },
      'OTP verified successfully',
      'OTP'
    );
  }

  // Helper methods
  private async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  private async sendPasswordResetEmail(email: string, token: string, fullname: string): Promise<void> {
    // In production, use proper email service like SendGrid, AWS SES, etc.
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    console.log(`Password reset email to ${email}: ${resetUrl}`);
    
    // Email implementation would go here with nodemailer or other service
    // For now, just log the reset URL
  }

  private async sendOtpEmail(email: string, otp: string, fullname: string, type: OtpType): Promise<void> {
    let subject = 'OTP Verification';
    let message = '';

    if (type === OtpType.EMAIL_VERIFICATION) {
      subject = 'Email Verification';
      message = 'Please verify your email address';
    } else if (type === OtpType.PASSWORD_RESET) {
      subject = 'Password Reset OTP';
      message = 'Use this OTP to reset your password';
    }

    console.log(`OTP email to ${email}: ${otp} for ${type} - ${message}`);
    
    // Email implementation would go here with nodemailer or other service
    // For now, just log the OTP
  }

  private async sendOtpSms(phone: string, otp: string, type: OtpType): Promise<void> {
    // In production, use SMS service like Twilio, AWS SNS, etc.
    console.log(`SMS to ${phone}: Your OTP is ${otp} for ${type}`);
    // SMS implementation would go here
  }

  // Forgot Password with OTP - Send OTP instead of email link
  async forgotPasswordWithOtp(forgotPasswordWithOtpDto: ForgotPasswordWithOtpDto): Promise<ApiResponse<any>> {
    const { email } = forgotPasswordWithOtpDto;

    // Check if customer exists
    const customer = await this.customerRepository.findOne({
      where: { email, is_active: true }
    });

    if (!customer) {
      // Don't reveal if email exists or not for security
      return ResponseHelper.success(
        null,
        'If an account with this email exists, an OTP has been sent for password reset',
        'Password Reset'
      );
    }

    // Send OTP for password reset
    const otpResult = await this.sendOtp({
      type: OtpType.PASSWORD_RESET,
      recipient: email
    });

    const isProd = process.env.NODE_ENV === 'production';

    return ResponseHelper.success(
      isProd ? null : otpResult.data,
      'OTP sent for password reset. Please check your email.',
      'Password Reset'
    );
  }

  // Reset Password with OTP
  async resetPasswordWithOtp(resetPasswordWithOtpDto: ResetPasswordWithOtpDto): Promise<ApiResponse<any>> {
    const { email, otp, new_password, confirm_password } = resetPasswordWithOtpDto;

    // Validate passwords match
    if (new_password !== confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find customer
    const customer = await this.customerRepository.findOne({
      where: { email, is_active: true }
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify OTP
    const otpRecord = await this.otpRepository.findOne({
      where: {
        token: otp,
        type: OtpType.PASSWORD_RESET,
        recipient: email,
        status: OtpStatus.PENDING,
        expires_at: MoreThan(new Date())
      }
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await this.otpRepository.update(otpRecord.id, {
      status: OtpStatus.USED,
      used_at: new Date(),
      updated_at: new Date()
    });

    // Hash new password
    const hashedPassword = await this.hashPassword(new_password);

    // Update customer password
    await this.customerRepository.update(customer.id, {
      password: hashedPassword,
      updated_at: new Date()
    });

    return ResponseHelper.success(
      null,
      'Password reset successfully',
      'Password Reset'
    );
  }
}
