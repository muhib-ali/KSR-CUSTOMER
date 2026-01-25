import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyEmailTokenDto {
  @ApiProperty({
    description: "Email verification token",
    example: "abc123-def456-ghi789"
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
