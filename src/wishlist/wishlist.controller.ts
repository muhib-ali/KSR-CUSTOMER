import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  ValidationPipe,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { WishlistItemDto } from './dto/wishlist-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Response DTOs
class WishlistResponse {
  statusCode: number;
  status: boolean;
  message: string;
  heading: string;
  data: any;
}

class WishlistItemResponse {
  id: string;
  customer_id: string;
  product_id: string;
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    currency: string;
    product_img_url?: string;
    stock_quantity: number;
    sku: string;
  };
  created_at: string;
}

class WishlistCheckResponse {
  inWishlist: boolean;
}

class WishlistCountResponse {
  count: number;
}

@ApiTags('Wishlist')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  private getCustomerId(req: any): string {
    return req?.user?.id ?? req?.user?.sub;
  }

  @Post('add')
  @ApiOperation({ 
    summary: 'Add product to wishlist',
    description: 'Add a product to the authenticated customer\'s wishlist'
  })
  @ApiBody({ 
    type: AddToWishlistDto,
    examples: {
      example1: {
        summary: 'Add product to wishlist',
        value: {
          product_id: '456e7890-e89b-12d3-a456-426614174001'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Product added to wishlist successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        status: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Product added to wishlist successfully' },
        heading: { type: 'string', example: 'Wishlist' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            customer_id: { type: 'string', example: '456e7890-e89b-12d3-a456-426614174002' },
            product_id: { type: 'string', example: '456e7890-e89b-12d3-a456-426614174001' },
            created_at: { type: 'string', example: '2024-01-10T10:00:00Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Product already in wishlist',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        status: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Product already in wishlist' },
        heading: { type: 'string', example: 'Wishlist' },
        data: { type: 'object', nullable: true }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer or Product not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        status: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Product not found' },
        heading: { type: 'string', example: 'Wishlist' },
        data: { type: 'object', nullable: true }
      }
    }
  })
  async addToWishlist(@Request() req, @Body(ValidationPipe) addToWishlistDto: AddToWishlistDto) {
    const customerId = this.getCustomerId(req);
    return {
      statusCode: 201,
      status: true,
      message: 'Product added to wishlist successfully',
      heading: 'Wishlist',
      data: await this.wishlistService.addToWishlist(customerId, addToWishlistDto),
    };
  }

  @Delete('remove/:productId')
  @ApiOperation({ 
    summary: 'Remove product from wishlist',
    description: 'Remove a product from the authenticated customer\'s wishlist'
  })
  @ApiParam({ 
    name: 'productId', 
    description: 'Product ID to remove from wishlist',
    example: '456e7890-e89b-12d3-a456-426614174001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Product removed from wishlist successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        status: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Product removed from wishlist successfully' },
        heading: { type: 'string', example: 'Wishlist' },
        data: { type: 'object', nullable: true }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Product not found in wishlist',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        status: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Product not found in wishlist' },
        heading: { type: 'string', example: 'Wishlist' },
        data: { type: 'object', nullable: true }
      }
    }
  })
  async removeFromWishlist(@Request() req, @Param('productId') productId: string) {
    const customerId = this.getCustomerId(req);
    
    try {
      await this.wishlistService.removeFromWishlist(customerId, productId);
      return {
        statusCode: 200,
        status: true,
        message: 'Product removed from wishlist successfully',
        heading: 'Wishlist',
        data: null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: 200,
          status: true,
          message: 'Product not found in wishlist (already removed)',
          heading: 'Wishlist',
          data: null,
        };
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get customer wishlist',
    description: 'Retrieve all products in the authenticated customer\'s wishlist'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wishlist retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        status: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Wishlist retrieved successfully' },
        heading: { type: 'string', example: 'Wishlist' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
              customer_id: { type: 'string', example: '456e7890-e89b-12d3-a456-426614174002' },
              product_id: { type: 'string', example: '456e7890-e89b-12d3-a456-426614174001' },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '456e7890-e89b-12d3-a456-426614174001' },
                  title: { type: 'string', example: 'Sample Product' },
                  description: { type: 'string', example: 'Product description' },
                  price: { type: 'number', example: 99.99 },
                  currency: { type: 'string', example: 'USD' },
                  product_img_url: { type: 'string', example: 'https://example.com/image.jpg' },
                  stock_quantity: { type: 'number', example: 10 },
                  sku: { type: 'string', example: 'PROD-001' }
                }
              },
              created_at: { type: 'string', example: '2024-01-10T10:00:00Z' }
            }
          }
        }
      }
    }
  })
  async getWishlist(@Request() req) {
    const customerId = this.getCustomerId(req);
    const wishlist = await this.wishlistService.getWishlist(customerId);
    return {
      statusCode: 200,
      status: true,
      message: 'Wishlist retrieved successfully',
      heading: 'Wishlist',
      data: wishlist,
    };
  }

  @Get('check/:productId')
  @ApiOperation({ 
    summary: 'Check if product is in wishlist',
    description: 'Check if a specific product is in the authenticated customer\'s wishlist'
  })
  @ApiParam({ 
    name: 'productId', 
    description: 'Product ID to check',
    example: '456e7890-e89b-12d3-a456-426614174001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Check completed successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        status: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Check completed successfully' },
        heading: { type: 'string', example: 'Wishlist' },
        data: {
          type: 'object',
          properties: {
            inWishlist: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  async checkInWishlist(@Request() req, @Param('productId') productId: string) {
    const customerId = this.getCustomerId(req);
    const result = await this.wishlistService.checkInWishlist(customerId, productId);
    return {
      statusCode: 200,
      status: true,
      message: 'Check completed successfully',
      heading: 'Wishlist',
      data: result,
    };
  }

  @Get('count')
  @ApiOperation({ 
    summary: 'Get wishlist count',
    description: 'Get the total number of items in the authenticated customer\'s wishlist'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wishlist count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        status: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Wishlist count retrieved successfully' },
        heading: { type: 'string', example: 'Wishlist' },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number', example: 5 }
          }
        }
      }
    }
  })
  async getWishlistCount(@Request() req) {
    const customerId = this.getCustomerId(req);
    const count = await this.wishlistService.getWishlistCount(customerId);
    return {
      statusCode: 200,
      status: true,
      message: 'Wishlist count retrieved successfully',
      heading: 'Wishlist',
      data: count,
    };
  }
}
