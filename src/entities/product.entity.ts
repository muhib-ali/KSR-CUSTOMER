import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Category } from "./category.entity";
import { Subcategory } from "./subcategory.entity";
import { Brand } from "./brand.entity";
import { ProductImage } from "./product-image.entity";
import { Tax } from "./tax.entity";
import { Supplier } from "./supplier.entity";
import { Warehouse } from "./warehouse.entity";
import { Variant } from "./variant.entity";
import { CvgProduct } from "./cvg-product.entity";
import { BulkPrice } from "./bulk-price.entity";
import { OrderItem } from "./order-item.entity";
import { ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

@ApiTags('Product')
@Entity("products")
@Unique(["sku"])
@Index(["sku"])
export class Product extends BaseAuditColumns {
  @ApiProperty({ description: 'Product title', example: 'Premium Wireless Headphones' })
  @Column({ type: "varchar" })
  title: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'High-quality wireless headphones with noise cancellation' })
  @Column({ type: "varchar", nullable: true })
  description: string;

  @ApiProperty({ description: 'Product price', example: 299.99 })
  @Column({ type: "numeric" })
  price: number;

  @ApiPropertyOptional({ description: 'Product cost', example: 150.00 })
  @Column({ type: "numeric", nullable: true })
  cost: number;

  @ApiPropertyOptional({ description: 'Shipping cost', example: 10.00 })
  @Column({ type: "numeric", nullable: true })
  freight: number;

  @ApiProperty({ description: 'Stock quantity', example: 50 })
  @Column({ type: "int" })
  stock_quantity: number;

  @ApiProperty({ description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: "uuid" })
  category_id: string;

  @ApiPropertyOptional({ description: 'Subcategory ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: "uuid", nullable: true })
  subcategory_id: string;

  @ApiProperty({ description: 'Brand ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column({ type: "uuid" })
  brand_id: string;

  @ApiProperty({ description: 'Currency', example: 'NOK' })
  @Column({ type: "varchar" })
  currency: string;

  @ApiPropertyOptional({ description: 'Product image URL', example: 'https://example.com/products/headphones.jpg' })
  @Column({ type: "varchar", nullable: true })
  product_img_url: string;

  @ApiPropertyOptional({ description: 'Product video URL', example: 'https://example.com/videos/headphones-demo.mp4' })
  @Column({ type: "varchar", length: 512, nullable: true })
  product_video_url: string;

  @ApiProperty({ description: 'Product SKU', example: 'WH-1000XM4-BLK' })
  @Column({ type: "varchar" })
  sku: string;

  @ApiPropertyOptional({ description: 'Tax ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @Column({ type: "uuid", nullable: true })
  tax_id: string;

  @ApiPropertyOptional({ description: 'Supplier ID', example: '123e4567-e89b-12d3-a456-426614174003' })
  @Column({ type: "uuid", nullable: true })
  supplier_id: string;

  @ApiPropertyOptional({ description: 'Warehouse ID', example: '123e4567-e89b-12d3-a456-426614174004' })
  @Column({ type: "uuid", nullable: true })
  warehouse_id: string;

  @ApiProperty({ description: 'Discount percentage', example: 10.00 })
  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  discount: number;

  @ApiPropertyOptional({ description: 'Discount start date', example: '2024-01-01T00:00:00.000Z' })
  @Column({ type: "timestamp", nullable: true })
  start_discount_date: Date;

  @ApiPropertyOptional({ description: 'Discount end date', example: '2024-12-31T23:59:59.999Z' })
  @Column({ type: "timestamp", nullable: true })
  end_discount_date: Date;

  @ApiPropertyOptional({ description: 'Product length in cm', example: 25.5 })
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  length: number;

  @ApiPropertyOptional({ description: 'Product width in cm', example: 15.2 })
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  width: number;

  @ApiPropertyOptional({ description: 'Product height in cm', example: 20.0 })
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  height: number;

  @ApiPropertyOptional({ description: 'Product weight in kg', example: 0.5 })
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  weight: number;

  @ApiProperty({ description: 'Total price including tax', example: 329.99 })
  @Column({ type: "decimal", precision: 10, scale: 2 })
  total_price: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: "category_id" })
  category: Category;

  @ManyToOne(() => Subcategory, { nullable: true })
  @JoinColumn({ name: "subcategory_id" })
  subcategory: Subcategory;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: "brand_id" })
  brand: Brand;

  @ManyToOne(() => Tax)
  @JoinColumn({ name: "tax_id" })
  tax: Tax;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: "supplier_id" })
  supplier: Supplier;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: "warehouse_id" })
  warehouse: Warehouse;

  @OneToMany(() => ProductImage, (img) => img.product)
  images: ProductImage[];

  @OneToMany(() => Variant, (variant) => variant.product)
  variants: Variant[];

  @OneToMany(() => CvgProduct, (cvgProduct) => cvgProduct.product)
  cvgProducts: CvgProduct[];

  @OneToMany(() => BulkPrice, (bulkPrice) => bulkPrice.product)
  bulkPrices: BulkPrice[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  order_items: OrderItem[];
}
