import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { OtpType } from '../../entities/otp.entity';

export class SendOtpDto {
  @IsEnum(OtpType, { message: 'Invalid OTP type' })
  @IsNotEmpty({ message: 'OTP type is required' })
  type: OtpType;

  @IsString()
  @IsNotEmpty({ message: 'Recipient is required' })
  recipient: string; // Email or phone number
}
