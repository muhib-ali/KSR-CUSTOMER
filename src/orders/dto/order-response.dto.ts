import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "../../entities/order-status.enum";

export class OrderItemResponseDto {
  @ApiProperty({
    description: "Order item ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Product ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  product_id: string;

  @ApiProperty({
    description: "Product name",
    example: "Premium Headphones",
  })
  product_name: string;

  @ApiProperty({
    description: "Product SKU",
    example: "PH-001",
  })
  product_sku: string;

  @ApiProperty({
    description: "Quantity",
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: "Unit price",
    example: 99.99,
  })
  unit_price: number;

  @ApiProperty({
    description: "Total price",
    example: 199.98,
  })
  total_price: number;

  @ApiProperty({
    description: "Requested price per unit (bulk orders)",
    example: 85.0,
    required: false,
  })
  requested_price_per_unit?: number;

  @ApiProperty({
    description: "Offered price per unit (bulk orders)",
    example: 90.0,
    required: false,
  })
  offered_price_per_unit?: number;

  @ApiProperty({
    description: "Minimum quantity for bulk pricing",
    example: 10,
    required: false,
  })
  bulk_min_quantity?: number;

  @ApiProperty({
    description: "Item approval status for bulk orders: pending, accepted, rejected",
    example: "pending",
    required: false,
  })
  item_status?: string;
}

export class OrderResponseDto {
  @ApiProperty({
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Order number",
    example: "ORD-2024-001",
  })
  order_number: string;

  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  user_id: string;

  @ApiProperty({
    description: "Customer first name",
    example: "John",
  })
  first_name: string;

  @ApiProperty({
    description: "Customer last name",
    example: "Doe",
  })
  last_name: string;

  @ApiProperty({
    description: "Customer email",
    example: "john.doe@example.com",
  })
  email: string;

  @ApiProperty({
    description: "Customer phone",
    example: "+1234567890",
  })
  phone: string;

  @ApiProperty({
    description: "Shipping address",
    example: "123 Main Street, Apt 4B",
  })
  address: string;

  @ApiProperty({
    description: "City",
    example: "New York",
  })
  city: string;

  @ApiProperty({
    description: "State",
    example: "NY",
  })
  state: string;

  @ApiProperty({
    description: "ZIP code",
    example: "10001",
  })
  zip_code: string;

  @ApiProperty({
    description: "Country",
    example: "USA",
  })
  country: string;

  @ApiProperty({
    description: "Subtotal amount",
    example: 199.98,
  })
  subtotal_amount: number;

  @ApiProperty({
    description: "Discount amount",
    example: 20.00,
  })
  discount_amount: number;

  @ApiProperty({
    description: "Total amount",
    example: 179.98,
  })
  total_amount: number;

  @ApiProperty({
    description: "Promo code ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  promo_code_id: string;

  @ApiProperty({
    description: "Order status",
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: "Order notes",
    example: "Please deliver after 5 PM",
    required: false,
  })
  notes: string;

  @ApiProperty({
    description: "Order type",
    example: "regular",
  })
  order_type: string;

  @ApiProperty({
    description: "Order items",
    type: [OrderItemResponseDto],
    isArray: true,
  })
  order_items: OrderItemResponseDto[];

  @ApiProperty({
    description: "Created at",
    example: "2024-01-06T12:00:00.000Z",
  })
  created_at: Date;

  @ApiProperty({
    description: "Updated at",
    example: "2024-01-06T12:00:00.000Z",
  })
  updated_at: Date;
}

export class OrdersListResponseDto {
  @ApiProperty({
    description: "Orders",
    type: [OrderResponseDto],
    isArray: true,
  })
  orders: OrderResponseDto[];

  @ApiProperty({
    description: "Pagination information",
    example: {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
      nextPage: 2,
      prevPage: null,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage: number;
    prevPage: number;
  };
}
