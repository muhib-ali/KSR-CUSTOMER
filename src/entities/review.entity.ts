import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Product } from "./product.entity";
import { Customer } from "./customer.entity";
import { Order } from "./order.entity";
import { ReviewStatus } from "./review-status.enum";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity("reviews")
@Unique(["product_id", "user_id"])
@Index(["product_id", "status"])
@Index(["user_id"])
@Index(["created_at"])
export class Review extends BaseAuditColumns {
  @ApiProperty({ description: 'Product ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: "uuid" })
  product_id: string;

  @ApiProperty({ description: 'Customer/User ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column({ type: "uuid" })
  user_id: string;

  @ApiPropertyOptional({ description: 'Order ID (for verified purchase tracking)', example: '123e4567-e89b-12d3-a456-426614174002' })
  @Column({ type: "uuid", nullable: true })
  order_id: string;

  @ApiProperty({ description: 'Rating (1-5)', example: 5, minimum: 1, maximum: 5 })
  @Column({ type: "int" })
  rating: number;

  @ApiProperty({ description: 'Review comment/text', example: 'Great product! Highly recommended.' })
  @Column({ type: "text" })
  comment: string;

  @ApiProperty({ description: 'Review status', enum: ReviewStatus, example: ReviewStatus.PENDING })
  @Column({ type: "varchar", default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @ApiProperty({ description: 'Whether this is a verified purchase', example: true })
  @Column({ type: "boolean", default: false })
  is_verified_purchase: boolean;

  // Relationships
  @ManyToOne(() => Product, product => product.order_items)
  @JoinColumn({ name: "product_id" })
  product: Product;

  @ManyToOne(() => Customer, customer => customer.orders)
  @JoinColumn({ name: "user_id" })
  user: Customer;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: "order_id" })
  order: Order;
}
