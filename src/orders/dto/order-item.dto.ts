import { IsString, IsNumber, IsNotEmpty, IsUUID, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class OrderItemDto {
  @ApiProperty({
    description: "Cart item identifier",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  cart_id: string;

  @ApiProperty({
    description: "Requested price per unit for bulk orders",
    example: 85.00,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  requested_price_per_unit?: number;

  @ApiProperty({
    description: "Offered price per unit for bulk orders",
    example: 90.00,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  offered_price_per_unit?: number;

  @ApiProperty({
    description: "Minimum quantity for bulk pricing",
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  bulk_min_quantity?: number;
}
