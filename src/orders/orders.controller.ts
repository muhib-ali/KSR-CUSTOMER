import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto, OrdersListResponseDto } from './dto/order-response.dto';
import { ApiResponse as CustomApiResponse } from '../common/interfaces/api-response.interface';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('test-auth')
  @ApiOperation({ summary: 'Test authentication' })
  @ApiSecurity('JWT-auth')
  async testAuth(@Request() req: any): Promise<any> {
    return {
      message: 'Authentication working',
      user: req.user,
      headers: req.headers
    };
  }

  @Post('create')
  @ApiOperation({ 
    summary: 'Create a new order',
    description: 'Creates a new order from cart items. Customer only needs to send cart_id for each item. Product details (name, SKU, price) and quantity are automatically fetched from cart and database. User information (name, email, phone) is automatically pulled from the logged-in user account.'
  })
  @ApiSecurity('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    schema: {
      example: {
        statusCode: 201,
        status: true,
        message: 'Order created successfully and cart cleared',
        heading: 'Order',
        data: {
          order: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            order_number: "ORD-1641487200000-123",
            user_id: "user-uuid-here",
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
            address: "123 Main Street, Apt 4B, Building 5",
            city: "New York",
            state: "NY",
            zip_code: "10001",
            country: "USA",
            subtotal_amount: 229.97,
            discount_amount: 22.99,
            total_amount: 206.98,
            promo_code_id: null,
            status: "pending",
            notes: "Please deliver after 5 PM. Call before arrival.",
            order_type: "regular",
            created_at: "2024-01-06T20:00:00.000Z",
            updated_at: "2024-01-06T20:00:00.000Z"
          },
          order_items: [
            {
              id: "item-uuid-1",
              product_id: "123e4567-e89b-12d3-a456-426614174000",
              product_name: "Premium Headphones",
              product_sku: "PH-001",
              quantity: 2,
              unit_price: 99.99,
              total_price: 199.98,
              item_status: "accepted"
            },
            {
              id: "item-uuid-2",
              product_id: "456e7890-e89b-12d3-a456-426614174111",
              product_name: "Wireless Mouse",
              product_sku: "WM-002",
              quantity: 1,
              unit_price: 29.99,
              total_price: 29.99,
              item_status: "accepted"
            }
          ]
        }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid order data or product not found',
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: 'Product 123e4567-e89b-12d3-a456-426614174000 not found',
        heading: 'Error',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User not authenticated',
    schema: {
      example: {
        statusCode: 401,
        status: false,
        message: 'Unauthorized',
        heading: 'Error',
        data: null,
      },
    },
  })
  @ApiBody({ 
    type: CreateOrderDto,
    description: 'Order creation request. Only cart_id needed for each item. Product details (name, SKU, price) are automatically fetched from cart and database.',
    examples: {
      standard: {
        summary: 'Standard order with multiple cart items',
        value: {
          items: [
            {
              cart_id: "123e4567-e89b-12d3-a456-426614174000"
            },
            {
              cart_id: "456e7890-e89b-12d3-a456-426614174111"
            }
          ],
          address: "123 Main Street, Apt 4B, Building 5",
          city: "New York",
          state: "NY",
          zip_code: "10001",
          country: "USA",
          notes: "Please deliver after 5 PM. Call before arrival."
        }
      },
      bulk: {
        summary: 'Bulk order with custom pricing',
        value: {
          order_type: "bulk",
          items: [
            {
              cart_id: "123e4567-e89b-12d3-a456-426614174000",
              requested_price_per_unit: 85.00,
              offered_price_per_unit: 90.00,
              bulk_min_quantity: 10
            },
            {
              cart_id: "456e7890-e89b-12d3-a456-426614174111",
              requested_price_per_unit: 75.00,
              offered_price_per_unit: 80.00,
              bulk_min_quantity: 20
            }
          ],
          address: "456 Business Park, Suite 100",
          city: "Los Angeles",
          state: "CA",
          zip_code: "90001",
          country: "USA",
          notes: "Bulk order for workshop - please confirm pricing"
        }
      }
    }
  })
  async createOrder(@Request() req: any, @Body(ValidationPipe) createOrderDto: CreateOrderDto): Promise<CustomApiResponse<any>> {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiSecurity('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: OrdersListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User not authenticated',
    schema: {
      example: {
        statusCode: 401,
        status: false,
        message: 'Unauthorized',
        heading: 'Error',
        data: null,
      },
    },
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getMyOrders(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<any> {
    const userId = req.user.id;
    return await this.ordersService.getMyOrders(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiSecurity('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: 'Order not found',
        heading: 'Error',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User not authenticated',
    schema: {
      example: {
        statusCode: 401,
        status: false,
        message: 'Unauthorized',
        heading: 'Error',
        data: null,
      },
    },
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderById(
    @Request() req: any,
    @Param('id') orderId: string
  ): Promise<CustomApiResponse<any>> {
    const userId = req.user.id;
    return await this.ordersService.getOrderById(orderId, userId);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiSecurity('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Order cannot be cancelled',
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: 'Only pending orders can be cancelled',
        heading: 'Error',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: 'Order not found',
        heading: 'Error',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User not authenticated',
    schema: {
      example: {
        statusCode: 401,
        status: false,
        message: 'Unauthorized',
        heading: 'Error',
        data: null,
      },
    },
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async cancelOrder(
    @Request() req: any,
    @Param('id') orderId: string
  ): Promise<CustomApiResponse<any>> {
    const userId = req.user.id;
    return await this.ordersService.cancelOrder(orderId, userId);
  }
}
