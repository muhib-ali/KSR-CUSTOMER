import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CustomerCart } from '../entities/customer-cart.entity';
import { Product } from '../entities/product.entity';
import { Customer } from '../entities/customer.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerCart,
      Product,
      Customer,
    ]),
    AuthModule,
  ],
  controllers: [
    CartController,
  ],
  providers: [
    CartService,
  ],
  exports: [
    CartService,
  ],
})
export class CartModule {}
