import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateModuleDto {
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
