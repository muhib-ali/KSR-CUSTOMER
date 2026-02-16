import { IsString, IsOptional, IsNumber, IsUUID, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProductsDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of products per page', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by category name or ID', example: 'electronics' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by subcategory ID (use with category)', example: 'uuid' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Filter by brand name or ID', example: 'sony' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: "Stock filter. 'in' = in stock, 'out' = out of stock, 'all' = both",
    example: 'all',
    enum: ['all', 'in', 'out'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['all', 'in', 'out'])
  stock?: 'all' | 'in' | 'out' = 'all';

  @ApiPropertyOptional({ description: 'Minimum price filter', example: 50.00, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter', example: 500.00, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Sort field', example: 'created_at', enum: ['price', 'created_at', 'title', 'stock_quantity'] })
  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'created_at' | 'title' | 'stock_quantity' = 'created_at';

  @ApiPropertyOptional({ description: 'Sort order', example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Search query for products', example: 'wireless headphones' })
  @IsOptional()
  @IsString()
  search?: string;
}
