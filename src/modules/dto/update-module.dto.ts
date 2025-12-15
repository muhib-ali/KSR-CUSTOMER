import { IsString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateModuleDto {
  @ApiProperty({
    description: "Module ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: "Module title",
    example: "User Management",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Module slug (unique identifier)",
    example: "userManagement",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: "Module description",
    example: "Manage user accounts and profiles",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
