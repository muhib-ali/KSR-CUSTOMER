import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { OtpType } from '../../entities/otp.entity';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsEnum(OtpType, { message: 'Invalid OTP type' })
  @IsNotEmpty({ message: 'OTP type is required' })
  type: OtpType;

  @IsString()
  @IsNotEmpty({ message: 'Recipient is required' })
  recipient: string; // Email or phone number
}
