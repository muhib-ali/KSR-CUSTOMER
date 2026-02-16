import { IsOptional, IsString, IsBoolean } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationDto } from "./pagination.dto";
import { Transform } from "class-transformer";

export class SearchPaginationDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Search term",
    example: "nike",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Get variant types instead of products",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  variantTypes?: boolean;
}
