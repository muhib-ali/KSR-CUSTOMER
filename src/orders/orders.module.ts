import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderPayment } from '../entities/order-payment.entity';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { CustomerCart } from '../entities/customer-cart.entity';
import { AuthModule } from '../auth/auth.module';
import { PromoCodeModule } from '../promo-codes/promo-code.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderPayment,
      Customer,
      Product,
      CustomerCart,
    ]),
    AuthModule,
    PromoCodeModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
