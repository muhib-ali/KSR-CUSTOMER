import { IsString, IsNotEmpty, IsUUID, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePermissionDto {
  @ApiProperty({
    description: "Module ID (UUID)",
    example: "8af18c09-a3c0-4aeb-b730-6d489bfb26d6",
  })
  @IsUUID()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({
    description: "Permission title",
    example: "claim Management create",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Permission slug (unique within module)",
    example: "create",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: "Permission description",
    example: "Create claim",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
