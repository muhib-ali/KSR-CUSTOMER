import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BrandService } from './brand.service';

// Response DTOs
class BrandResponseDto {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class BrandListResponseDto {
  brands: BrandResponseDto[];
  total: number;
}

@ApiTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all brands',
    description: 'Retrieve a list of all available brands with their products'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Brands retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Brands retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            brands: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                  name: { type: 'string', example: 'Nike' },
                  description: { type: 'string', example: 'Sports apparel and footwear' },
                  is_active: { type: 'boolean', example: true },
                  created_at: { type: 'string', example: '2024-01-01T00:00:00Z' },
                  updated_at: { type: 'string', example: '2024-01-01T00:00:00Z' }
                }
              }
            }
          }
        }
      }
    }
  })
  async getAllBrands() {
    return this.brandService.getAllBrands();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get brand by ID',
    description: 'Retrieve a specific brand by its unique ID'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Brand retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Brand retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            name: { type: 'string', example: 'Nike' },
            description: { type: 'string', example: 'Sports apparel and footwear' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', example: '2024-01-01T00:00:00Z' },
            updated_at: { type: 'string', example: '2024-01-01T00:00:00Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Brand not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Brand not found' },
        error: { type: 'string', example: 'NOT_FOUND' }
      }
    }
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Brand unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getBrandById(@Param('id') id: string) {
    return this.brandService.getBrandById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ 
    summary: 'Get brand by slug',
    description: 'Retrieve a specific brand by its URL-friendly slug'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Brand retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Brand retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            name: { type: 'string', example: 'Nike' },
            description: { type: 'string', example: 'Sports apparel and footwear' },
            slug: { type: 'string', example: 'nike' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', example: '2024-01-01T00:00:00Z' },
            updated_at: { type: 'string', example: '2024-01-01T00:00:00Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Brand not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Brand not found' },
        error: { type: 'string', example: 'NOT_FOUND' }
      }
    }
  })
  @ApiParam({ 
    name: 'slug', 
    description: 'Brand URL slug',
    example: 'nike'
  })
  async getBrandBySlug(@Param('slug') slug: string) {
    return this.brandService.getBrandBySlug(slug);
  }
}
