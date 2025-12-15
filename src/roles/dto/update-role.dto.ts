import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
  IsUUID,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateRoleDto {
  @ApiProperty({
    description: "Role UUID",
    example: "550e8400-e29b-41d4-a716-446655440000",
    format: "uuid",
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({
    description: "Role title",
    example: "Updated Role Title",
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiProperty({
    description: "Role active status",
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
