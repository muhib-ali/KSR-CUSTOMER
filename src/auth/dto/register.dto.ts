import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    description: "Customer full name",
    example: "John Doe",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullname: string;

  @ApiProperty({
    description: "Customer username",
    example: "johndoe",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: "Customer email address",
    example: "john@example.com",
    format: "email",
    maxLength: 100,
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  @MaxLength(100)
  email: string;

  @ApiProperty({
    description: "Customer password",
    example: "Password@123",
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @ApiProperty({
    description: "Customer phone number",
    example: "+923001234567",
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
