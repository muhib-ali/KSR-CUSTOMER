import { IsArray, IsString, IsOptional, IsNotEmpty, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { OrderItemDto } from "./order-item.dto";

export class CreateOrderDto {
  @ApiProperty({
    description: "List of cart items to order (cart_id only)",
    type: [OrderItemDto],
    isArray: true,
    example: [
      {
        cart_id: "123e4567-e89b-12d3-a456-426614174000"
      },
      {
        cart_id: "456e7890-e89b-12d3-a456-426614174111"
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: "Optional promo code for discount",
    example: "SAVE10",
    required: false,
  })
  @IsOptional()
  @IsString()
  promo_code?: string;

  // Shipping address (user provided)
  @ApiProperty({
    description: "Complete shipping address including street number and apartment details",
    example: "123 Main Street, Apt 4B, Building 5",
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: "City name for shipping address",
    example: "New York",
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: "State or province code",
    example: "NY",
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: "Postal code or ZIP code",
    example: "10001",
  })
  @IsString()
  @IsNotEmpty()
  zip_code: string;

  @ApiProperty({
    description: "Country name for shipping",
    example: "USA",
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: "Additional order instructions or delivery preferences",
    example: "Please deliver after 5 PM. Call before arrival.",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: "Order type (optional). This value is ignored by the server because the order type is derived from the cart item type (regular/bulk).",
    example: "regular",
    required: false,
    default: "regular"
  })
  @IsOptional()
  @IsString()
  order_type?: string;
}
