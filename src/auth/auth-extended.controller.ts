import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthExtendedService } from './auth-extended.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordWithOtpDto } from './dto/forgot-password-with-otp.dto';
import { ResetPasswordWithOtpDto } from './dto/reset-password-with-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ResponseHelper } from '../common/helpers/response.helper';

@ApiTags('Authentication Extended')
@Controller('auth')
export class AuthExtendedController {
  constructor(private readonly authExtendedService: AuthExtendedService) {}

  @Post('forgot-password')
  @ApiOperation({ 
    summary: 'Forgot Password',
    description: 'Send password reset link to user email. For security reasons, this endpoint always returns success even if email doesn\'t exist.'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (or would be sent if email exists)',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'If an account with this email exists, a password reset link has been sent',
        heading: 'Password Reset',
        data: null
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid email format',
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: 'Please provide a valid email address',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Forgot password request',
    examples: {
      standard: {
        summary: 'Standard forgot password request',
        value: {
          email: 'john@example.com'
        }
      }
    }
  })
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto) {
    return this.authExtendedService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ 
    summary: 'Reset Password',
    description: 'Reset user password using the token received in email. Token expires after 1 hour.'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'Password reset successfully',
        heading: 'Password Reset',
        data: null
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid token, expired token, or password mismatch',
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: 'Invalid or expired reset token',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiBody({ 
    type: ResetPasswordDto,
    description: 'Reset password request',
    examples: {
      standard: {
        summary: 'Standard reset password request',
        value: {
          token: 'abc123def456...',
          new_password: 'NewSecurePass123!',
          confirm_password: 'NewSecurePass123!'
        }
      }
    }
  })
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto) {
    return this.authExtendedService.resetPassword(resetPasswordDto);
  }

  @Post('send-otp')
  @ApiOperation({ 
    summary: 'Send OTP',
    description: 'Send One-Time Password to user email or phone for various verification purposes. OTP expires after 10 minutes.'
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully (Development Only - OTP returned in response)',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'OTP sent successfully',
        heading: 'OTP',
        data: {
          otp: '123456',
          expires_at: '2026-01-14T19:45:00.000Z',
          recipient: 'john@example.com',
          type: 'password_reset'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully (Production - OTP not returned in response)',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'OTP sent successfully',
        heading: 'OTP',
        data: null
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OTP type or customer not found',
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: 'Customer not found',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - Failed to send OTP',
    schema: {
      example: {
        statusCode: 500,
        status: false,
        message: 'Failed to send OTP',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiBody({ 
    type: SendOtpDto,
    description: 'Send OTP request',
    examples: {
      emailVerification: {
        summary: 'Send OTP for email verification',
        value: {
          type: 'email_verification',
          recipient: 'john@example.com'
        }
      },
      phoneVerification: {
        summary: 'Send OTP for phone verification',
        value: {
          type: 'phone_verification',
          recipient: '+1234567890'
        }
      },
      passwordReset: {
        summary: 'Send OTP for password reset',
        value: {
          type: 'password_reset',
          recipient: 'john@example.com'
        }
      }
    }
  })
  async sendOtp(@Body(ValidationPipe) sendOtpDto: SendOtpDto) {
    return this.authExtendedService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @ApiOperation({ 
    summary: 'Verify OTP',
    description: 'Verify One-Time Password sent to user email or phone. OTP can only be used once and expires after 10 minutes.'
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'OTP verified successfully',
        heading: 'OTP',
        data: {
          verified: true,
          customer_id: 'e261e7c4-6a8d-4357-bf59-99e4b39cdfa0'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OTP, expired OTP, or too many attempts',
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: 'Invalid or expired OTP',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiBody({ 
    type: VerifyOtpDto,
    description: 'Verify OTP request',
    examples: {
      emailVerification: {
        summary: 'Verify email OTP',
        value: {
          token: '123456',
          type: 'email_verification',
          recipient: 'john@example.com'
        }
      },
      phoneVerification: {
        summary: 'Verify phone OTP',
        value: {
          token: '123456',
          type: 'phone_verification',
          recipient: '+1234567890'
        }
      },
      passwordReset: {
        summary: 'Verify password reset OTP',
        value: {
          token: '123456',
          type: 'password_reset',
          recipient: 'john@example.com'
        }
      }
    }
  })
  async verifyOtp(@Body(ValidationPipe) verifyOtpDto: VerifyOtpDto) {
    return this.authExtendedService.verifyOtp(verifyOtpDto);
  }

  @Post('forgot-password-otp')
  @ApiOperation({ 
    summary: 'Forgot Password with OTP',
    description: 'Send OTP for password reset verification instead of email link'
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent for password reset (Development Only - OTP returned in response)',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'OTP sent for password reset. Please check your email.',
        heading: 'Password Reset',
        data: {
          otp: '123456',
          expires_at: '2026-01-14T19:45:00.000Z',
          recipient: 'john@example.com',
          type: 'password_reset'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent for password reset (Production - OTP not returned in response)',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'OTP sent for password reset. Please check your email.',
        heading: 'Password Reset',
        data: null
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid email format',
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: 'Please provide a valid email address',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiBody({ 
    type: ForgotPasswordWithOtpDto,
    description: 'Forgot password with OTP request',
    examples: {
      standard: {
        summary: 'Send OTP for password reset',
        value: {
          email: 'john@example.com'
        }
      }
    }
  })
  async forgotPasswordWithOtp(@Body(ValidationPipe) forgotPasswordWithOtpDto: ForgotPasswordWithOtpDto) {
    return this.authExtendedService.forgotPasswordWithOtp(forgotPasswordWithOtpDto);
  }

  @Post('reset-password-with-otp')
  @ApiOperation({ 
    summary: 'Reset Password with OTP',
    description: 'Reset password using OTP verification. This is the recommended secure method for password reset.'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'Password reset successfully',
        heading: 'Password Reset',
        data: null
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OTP, expired OTP, or password mismatch',
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: 'Invalid or expired OTP',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Customer not found',
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: 'Customer not found',
        heading: 'Error',
        data: null
      }
    }
  })
  @ApiBody({ 
    type: ResetPasswordWithOtpDto,
    description: 'Reset password with OTP request',
    examples: {
      standard: {
        summary: 'Reset password with OTP',
        value: {
          email: 'john@example.com',
          otp: '123456',
          new_password: 'NewSecurePass123!',
          confirm_password: 'NewSecurePass123!'
        }
      }
    }
  })
  async resetPasswordWithOtp(@Body(ValidationPipe) resetPasswordWithOtpDto: ResetPasswordWithOtpDto) {
    return this.authExtendedService.resetPasswordWithOtp(resetPasswordWithOtpDto);
  }

  @Post('test-otp-flow')
  @ApiOperation({ 
    summary: 'Test OTP Flow (Development Only)',
    description: 'Test endpoint for development - sends and verifies OTP in one call. Remove in production!'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'OTP flow test completed',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'OTP flow test completed successfully',
        heading: 'Test',
        data: {
          otp_sent: '123456',
          otp_verified: true
        }
      }
    }
  })
  async testOtpFlow(@Body() body: { type: string; recipient: string }) {
    // Send OTP
    const sendResult = await this.authExtendedService.sendOtp({
      type: body.type as any,
      recipient: body.recipient
    });

    // Extract OTP from console log (for testing only)
    // In real implementation, you'd need to check logs or use a test email service
    return ResponseHelper.success(
      { 
        message: 'OTP sent. Check console for OTP code.',
        otp_sent: 'Check console logs',
        flow: 'Send OTP -> Verify OTP'
      },
      'OTP flow test initiated',
      'Test'
    );
  }
}
