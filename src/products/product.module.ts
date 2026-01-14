import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { Brand } from '../entities/brand.entity';
import { ProductImage } from '../entities/product-image.entity';
import { Variant } from '../entities/variant.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Review } from '../entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Brand,
      ProductImage,
      Variant,
      Order,
      OrderItem,
      Review,
    ]),
  ],
  controllers: [
    ProductController,
  ],
  providers: [
    ProductService,
  ],
  exports: [
    ProductService,
  ],
})
export class ProductModule {}
