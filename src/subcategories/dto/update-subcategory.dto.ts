import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateSubcategoryDto {
  @ApiProperty({
    description: "Subcategory ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: "Subcategory name",
    example: "Running Shoes",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: "Subcategory description",
    example: "Athletic running shoes",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "Parent category ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  cat_id: string;

  @ApiPropertyOptional({
    description: "Subcategory active status",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
