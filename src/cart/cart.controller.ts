import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SwaggerJwtAuthGuard } from '../auth/swagger-jwt-auth.guard';

// Response DTOs
class CartItemResponseDto {
  id: string;
  product_id: string;
  title: string;
  description?: string;
  price: number;
  cost?: number;
  freight?: number;
  currency: string;
  product_img_url?: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

class CartSummaryResponseDto {
  totalItems: number;
  totalAmount: number;
  currency: string;
}

class CartResponseDto {
  items: CartItemResponseDto[];
  summary: CartSummaryResponseDto;
}

// Request DTOs for Swagger
class AddToCartRequestDto {
  product_id: string;
  quantity: number;
}

class UpdateCartRequestDto {
  quantity: number;
}

@ApiTags('Cart')
@ApiSecurity('JWT-auth')
@Controller('cart')
@UseGuards(SwaggerJwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get customer cart',
    description: 'Retrieve all items in the authenticated customer\'s shopping cart'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cart retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                  product_id: { type: 'string', example: '456e7890-e89b-12d3-a456-426614174001' },
                  title: { type: 'string', example: 'Nike Air Max 90' },
                  description: { type: 'string', example: 'Classic running shoes' },
                  price: { type: 'number', example: 129.99 },
                  cost: { type: 'number', example: 99.99 },
                  freight: { type: 'number', example: 15.00 },
                  currency: { type: 'string', example: 'USD' },
                  product_img_url: { type: 'string', example: 'https://example.com/image.jpg' },
                  quantity: { type: 'number', example: 2 },
                  created_at: { type: 'string', example: '2024-01-01T00:00:00Z' },
                  updated_at: { type: 'string', example: '2024-01-01T00:00:00Z' }
                }
              }
            },
            summary: {
              type: 'object',
              properties: {
                totalItems: { type: 'number', example: 5 },
                totalAmount: { type: 'number', example: 649.95 },
                currency: { type: 'string', example: 'USD' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'UNAUTHORIZED' }
      }
    }
  })
  async getCart(@Request() req) {
    return this.cartService.getCustomerCart(req.user.id);
  }

  @Post('add')
  @ApiOperation({ 
    summary: 'Add item to cart',
    description: 'Add a product to the authenticated customer\'s shopping cart'
  })
  @ApiBody({ 
    type: AddToCartRequestDto,
    examples: {
      example1: {
        summary: 'Add 2 items to cart',
        value: {
          product_id: '456e7890-e89b-12d3-a456-426614174001',
          quantity: 2
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Item added to cart successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Item added to cart successfully' },
        data: { type: 'object', example: null }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - insufficient stock or invalid data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Insufficient stock available' },
        error: { type: 'string', example: 'BAD_REQUEST' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'UNAUTHORIZED' }
      }
    }
  })
  async addToCart(@Request() req, @Body(ValidationPipe) addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, addToCartDto);
  }

  @Put('update/:cartItemId')
  @ApiOperation({ 
    summary: 'Update cart item quantity',
    description: 'Update the quantity of an existing item in the cart. Set quantity to 0 to remove the item.'
  })
  @ApiParam({ 
    name: 'cartItemId', 
    description: 'Cart item unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ 
    type: UpdateCartRequestDto,
    examples: {
      example1: {
        summary: 'Update quantity to 3',
        value: {
          quantity: 3
        }
      },
      example2: {
        summary: 'Remove item by setting quantity to 0',
        value: {
          quantity: 0
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart item updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cart item updated successfully' },
        data: {
          type: 'object',
          properties: {
            cartItemId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            newQuantity: { type: 'number', example: 3 },
            previousQuantity: { type: 'number', example: 2 },
            availableStock: { type: 'number', example: 50 }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - insufficient stock, invalid quantity, or product unavailable',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Insufficient stock available. Only 5 items available.' },
        error: { type: 'string', example: 'BAD_REQUEST' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'UNAUTHORIZED' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cart item not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Cart item not found' },
        error: { type: 'string', example: 'NOT_FOUND' }
      }
    }
  })
  async updateCartItem(
    @Request() req,
    @Param('cartItemId') cartItemId: string,
    @Body(ValidationPipe) updateCartDto: UpdateCartDto,
  ) {
    return this.cartService.updateCartItem(req.user.id, cartItemId, updateCartDto);
  }

  @Delete('remove/:cartItemId')
  @ApiOperation({ 
    summary: 'Remove item from cart',
    description: 'Remove an item from the authenticated customer\'s shopping cart'
  })
  @ApiParam({ 
    name: 'cartItemId', 
    description: 'Cart item unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Item removed from cart successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Item removed from cart successfully' },
        data: { type: 'object', example: null }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'UNAUTHORIZED' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cart item not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Cart item not found' },
        error: { type: 'string', example: 'NOT_FOUND' }
      }
    }
  })
  async removeFromCart(@Request() req, @Param('cartItemId') cartItemId: string) {
    return this.cartService.removeFromCart(req.user.id, cartItemId);
  }

  @Delete('clear')
  @ApiOperation({ 
    summary: 'Clear entire cart',
    description: 'Remove all items from the authenticated customer\'s shopping cart'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart cleared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cart cleared successfully' },
        data: { type: 'object', example: null }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'UNAUTHORIZED' }
      }
    }
  })
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
