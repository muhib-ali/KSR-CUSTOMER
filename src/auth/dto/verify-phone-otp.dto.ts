import { IsString, IsNotEmpty, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyPhoneOtpDto {
  @ApiProperty({
    description: "Phone number",
    example: "+1234567890"
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: "6-digit OTP code",
    example: "123456"
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
