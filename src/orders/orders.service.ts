import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Order } from "../entities/order.entity";
import { OrderItem } from "../entities/order-item.entity";
import { OrderPayment } from "../entities/order-payment.entity";
import { Customer } from "../entities/customer.entity";
import { Product } from "../entities/product.entity";
import { CustomerCart } from "../entities/customer-cart.entity";
import { OrderStatus } from "../entities/order-status.enum";
import { ApiResponse as CustomApiResponse, PaginatedApiResponse } from "../common/interfaces/api-response.interface";
import { ResponseHelper } from "../common/helpers/response.helper";
import { PromoCodeService } from "../promo-codes/promo-code.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderPayment)
    private orderPaymentRepository: Repository<OrderPayment>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(CustomerCart)
    private cartRepository: Repository<CustomerCart>,
    private promoCodeService: PromoCodeService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<CustomApiResponse<any>> {
    // 1. Get logged-in user (security)
    const user = await this.customerRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. Validate cart items and get complete product details
    const validatedItems = await this.validateCartItems(createOrderDto.items, userId);

    // 3. Determine order type from cart (do not trust request body)
    const uniqueCartTypes = Array.from(
      new Set(
        validatedItems
          .map((i) => (i.cart_type || 'regular').toString())
          .filter((t) => t)
      )
    );

    if (uniqueCartTypes.length > 1) {
      throw new BadRequestException('Cart contains mixed item types. Please clear your cart and try again.');
    }

    const orderType = uniqueCartTypes[0] === 'bulk' ? 'bulk' : 'regular';

    // 4. Calculate totals and get promo code details if provided
    let promoCodeId = null;
    const { subtotal, discount, total } = await this.calculateTotals(
      validatedItems,
      createOrderDto.promo_code
    );

    // If promo code was used, fetch its ID
    if (createOrderDto.promo_code) {
      const promo = await this.promoCodeService.validatePromoCode(createOrderDto.promo_code, subtotal);
      promoCodeId = promo.id;
    }

    // 5. Generate order number
    const orderNumber = this.generateOrderNumber();

    // 6. Create order with user info (secure)
    const order = this.orderRepository.create({
      user_id: userId,
      order_number: orderNumber,
      
      // User info (from logged-in user, cannot be faked)
      first_name: user.fullname.split(' ')[0] || user.fullname,
      last_name: user.fullname.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone || '',
      
      // Shipping address (user provided)
      address: createOrderDto.address,
      city: createOrderDto.city,
      state: createOrderDto.state,
      zip_code: createOrderDto.zip_code,
      country: createOrderDto.country,
      
      // Order details
      subtotal_amount: subtotal,
      discount_amount: discount,
      total_amount: total,
      promo_code_id: promoCodeId,
      status: OrderStatus.PENDING,
      notes: createOrderDto.notes || '',
      order_type: orderType
    });

    // 6. Save order
    const savedOrder = await this.orderRepository.save(order);

    // 7. Create order items with validated product data
    const orderItems = await this.createOrderItems(savedOrder.id, validatedItems, orderType);

    // 8. Handle promo code usage (if applicable)
    if (createOrderDto.promo_code) {
      await this.handlePromoCodeUsage(createOrderDto.promo_code);
    }

    // 9. Deduct product quantities
    console.log('About to deduct product quantities...');
    try {
      await this.deductProductQuantities(validatedItems);
      console.log('Product quantities deducted successfully');
    } catch (error) {
      // Log error but don't fail the order
      console.error('Failed to deduct product quantities:', error);
    }

    // 10. Clear cart items after successful order creation
    try {
      await this.clearCartItems(userId, createOrderDto.items);
    } catch (error) {
      // Log error but don't fail the order
      console.error('Failed to clear cart items:', error);
    }

    return ResponseHelper.success(
      {
        order: savedOrder,
        order_items: orderItems
      },
      'Order created successfully and cart cleared',
      'Order'
    );
  }

  async getMyOrders(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedApiResponse<Order>> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.user_id = :userId', { userId })
      .orderBy('order.created_at', 'DESC');

    const [orders, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return ResponseHelper.paginated(
      orders,
      page,
      limit,
      total,
      'orders',
      'Orders retrieved successfully',
      'Success'
    );
  }

  async getOrderById(orderId: string, userId: string): Promise<CustomApiResponse<Order>> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user_id: userId }, // Security check
      relations: ['order_items', 'order_items.product']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return ResponseHelper.success(
      order,
      'Order retrieved successfully',
      'Order'
    );
  }

  async cancelOrder(orderId: string, userId: string): Promise<CustomApiResponse<Order>> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user_id: userId } // Security check
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    // Use update instead of save to ensure we're updating the existing record
    await this.orderRepository.update(orderId, {
      status: OrderStatus.CANCELLED,
      updated_at: new Date()
    });

    // Fetch the updated order
    const updatedOrder = await this.orderRepository.findOne({
      where: { id: orderId }
    });

    return ResponseHelper.success(
      updatedOrder,
      'Order cancelled successfully',
      'Order'
    );
  }

  private async validateCartItems(cartItems: any[], userId: string): Promise<any[]> {
    const validatedItems = [];
    
    for (const item of cartItems) {
      // Get cart item
      const cartItem = await this.cartRepository.findOne({
        where: { 
          id: item.cart_id, 
          customer_id: userId, 
          is_active: true 
        }
      });

      if (!cartItem) {
        throw new BadRequestException(`Cart item ${item.cart_id} not found`);
      }

      // Get product details
      const product = await this.productRepository.findOne({
        where: { id: cartItem.product_id, is_active: true }
      });

      if (!product) {
        throw new BadRequestException(`Product ${cartItem.product_id} not found`);
      }

      // Check product stock
      if (product.stock_quantity < cartItem.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.title}`);
      }

      // Calculate prices from product data
      // For bulk cart items we rely on the offered price stored on cart, otherwise fall back to product price
      const offeredPrice = item.offered_price_per_unit ?? cartItem.offered_price_per_unit;
      const requestedPrice = item.requested_price_per_unit ?? cartItem.requested_price_per_unit;
      const bulkMinQty = item.bulk_min_quantity ?? cartItem.bulk_min_quantity;

      const unitPrice = offeredPrice ?? product.total_price; // Tax-inclusive price from product
      const totalPrice = cartItem.quantity * unitPrice;

      validatedItems.push({
        product_id: cartItem.product_id,
        product_name: product.title,
        product_sku: product.sku || '',
        quantity: cartItem.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        cart_type: cartItem.type || 'regular',
        requested_price_per_unit: requestedPrice,
        offered_price_per_unit: offeredPrice,
        bulk_min_quantity: bulkMinQty
      });
    }

    return validatedItems;
  }

  private async deductProductQuantities(orderItems: any[]): Promise<void> {
    console.log('Starting product quantity deduction for items:', orderItems.length);
    
    for (const item of orderItems) {
      console.log(`Processing item: product_id=${item.product_id}, quantity=${item.quantity}`);
      
      try {
        // First check current stock
        const product = await this.productRepository.findOne({
          where: { id: item.product_id }
        });
        
        if (!product) {
          console.error(`Product ${item.product_id} not found`);
          continue;
        }
        
        console.log(`Current stock for product ${item.product_id}: ${product.stock_quantity}`);
        
        // Check if enough stock is available
        if (product.stock_quantity < item.quantity) {
          console.error(`Insufficient stock for product ${item.product_id}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
          continue;
        }
        
        // Update stock by subtracting ordered quantity (not setting to 0)
        product.stock_quantity = product.stock_quantity - item.quantity;
        const updatedProduct = await this.productRepository.save(product);
        
        console.log(`Stock for product ${item.product_id} updated from ${product.stock_quantity + item.quantity} to: ${updatedProduct.stock_quantity}`);
        
      } catch (error) {
        console.error(`Failed to update stock for product ${item.product_id}:`, error);
        // Continue with other products even if one fails
      }
    }
    
    console.log('Product quantity deduction completed');
  }

  private async clearCartItems(userId: string, cartItems: any[]): Promise<void> {
    const cartIds = cartItems.map(item => item.cart_id);
    
    await this.cartRepository
      .createQueryBuilder('customer_cart')
      .where('customer_cart.customer_id = :userId', { userId })
      .andWhere('customer_cart.id IN (:...cartIds)', { cartIds })
      .delete()
      .execute();
  }

  private async calculateTotals(items: any[], promoCode?: string): Promise<{ subtotal: number; discount: number; total: number }> {
    let subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    let discount = 0;

    if (promoCode) {
      try {
        // Validate promo code
        const promo = await this.promoCodeService.validatePromoCode(promoCode, subtotal);
        
        // Calculate discount
        discount = await this.promoCodeService.calculateDiscount(promo, subtotal);
        
        console.log(`Promo code ${promoCode} applied: $${discount} discount`);
      } catch (error) {
        // If promo code is invalid, log error but don't fail the order
        console.error('Invalid promo code:', error.message);
        // Re-throw the error so the user knows the promo code is invalid
        throw error;
      }
    }

    const total = Math.max(0, subtotal - discount);

    return { subtotal, discount, total };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  private async createOrderItems(orderId: string, items: any[], orderType: string): Promise<OrderItem[]> {
    const orderItems = [];

    for (const item of items) {
      const orderItem = this.orderItemRepository.create({
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        requested_price_per_unit: item.requested_price_per_unit,
        offered_price_per_unit: item.offered_price_per_unit,
        bulk_min_quantity: item.bulk_min_quantity,
        item_status: orderType === 'bulk' ? 'pending' : 'accepted'
      });

      orderItems.push(await this.orderItemRepository.save(orderItem));
    }

    return orderItems;
  }

  private async handlePromoCodeUsage(promoCode: string): Promise<void> {
    try {
      await this.promoCodeService.incrementUsage(promoCode);
      console.log(`Promo code ${promoCode} usage incremented`);
    } catch (error) {
      // Log error but don't fail the order
      console.error('Failed to increment promo code usage:', error);
    }
  }
}
