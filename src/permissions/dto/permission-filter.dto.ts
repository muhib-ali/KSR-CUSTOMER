import { IsOptional, IsUUID, IsNumber, Min, Max } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

export class PermissionFilterDto {
  @ApiPropertyOptional({
    description: "Page number",
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: "Items per page",
    example: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: "Module ID to filter permissions",
    example: "8af18c09-a3c0-4aeb-b730-6d489bfb26d6",
    type: String,
  })
  @IsOptional()
  @IsUUID()
  moduleId?: string;
}
