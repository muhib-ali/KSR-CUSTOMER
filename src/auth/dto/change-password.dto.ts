import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    description: "Current (existing) password of the authenticated user",
    example: "OldPass123!",
  })
  @IsString()
  @IsNotEmpty({ message: "Current password is required" })
  current_password: string;

  @ApiProperty({
    description: "New password to set",
    example: "NewSecurePass123!",
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: "New password is required" })
  @MinLength(8, { message: "New password must be at least 8 characters long" })
  new_password: string;

  @ApiProperty({
    description: "Confirm new password (must match new_password)",
    example: "NewSecurePass123!",
  })
  @IsString()
  @IsNotEmpty({ message: "Confirm password is required" })
  confirm_password: string;
}
