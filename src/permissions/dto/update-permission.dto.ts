import { IsString, IsNotEmpty, IsUUID, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdatePermissionDto {
  @ApiProperty({
    description: "Permission ID",
    example: "9eca588e-e8f9-4346-abea-f57e84d85069",
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: "Module ID (UUID)",
    example: "8af18c09-a3c0-4aeb-b730-6d489bfb26d0",
  })
  @IsUUID()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({
    description: "Permission title",
    example: "claim Management create 1",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Permission slug (unique within module)",
    example: "create 1",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: "Permission description",
    example: "Create claim 1",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
