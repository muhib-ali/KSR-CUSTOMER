import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SendPhoneOtpDto {
  @ApiProperty({
    description: "Phone number to send OTP to",
    example: "+1234567890"
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
