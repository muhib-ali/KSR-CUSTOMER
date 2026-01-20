import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '../common/helpers/response.helper';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';
import { CustomerCart } from '../entities/customer-cart.entity';
import { Product } from '../entities/product.entity';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CustomerCart)
    private cartRepository: Repository<CustomerCart>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async getCustomerCart(customerId: string): Promise<ApiResponse<any>> {
    const cartItems = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoin('products', 'product', 'product.id = cart.product_id')
      .leftJoin('categories', 'category', 'category.id = product.category_id')
      .leftJoin('brands', 'brand', 'brand.id = product.brand_id')
      .select([
        'cart.id',
        'cart.quantity',
        'cart.type',
        'cart.requested_price_per_unit',
        'cart.offered_price_per_unit',
        'cart.bulk_min_quantity',
        'cart.created_at',
        'cart.updated_at',
        'product.id',
        'product.title',
        'product.description',
        'product.price',
        'product.cost',
        'product.freight',
        'product.currency',
        'product.product_img_url',
        'product.stock_quantity',
        'product.sku',
        'category.id as category_id',
        'category.name as category_name',
        'brand.id as brand_id',
        'brand.name as brand_name',
      ])
      .where('cart.customer_id = :customerId', { customerId })
      .andWhere('cart.is_active = true')
      .orderBy('cart.created_at', 'DESC')
      .getRawMany();

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cartItems.reduce(
      (sum, item) => {
        // Use requested price for bulk items, regular price for regular items
        const unitPrice = item.type === 'bulk' && item.requested_price_per_unit 
          ? item.requested_price_per_unit 
          : item.price;
        return sum + (unitPrice * item.quantity);
      },
      0
    );

    return ResponseHelper.success(
      {
        items: cartItems,
        summary: {
          totalItems,
          totalAmount,
          currency: cartItems[0]?.currency || 'USD',
          cartType: cartItems.some(item => item.type === 'bulk') ? 'bulk' : 'regular',
        },
      },
      'Cart retrieved successfully',
      'Cart'
    );
  }

  async addToCart(customerId: string, addToCartDto: AddToCartDto): Promise<ApiResponse<any>> {
    const { product_id, quantity, type, requested_price_per_unit, offered_price_per_unit, bulk_min_quantity } = addToCartDto;
    const incomingType = type || 'regular';

    if (!customerId) {
      throw new BadRequestException('Customer ID is required');
    }

    console.log('CartService - AddToCart request:', {
      customer_id: customerId,
      product_id,
      quantity,
      incomingType,
    });

    // Check if product exists and has sufficient stock
    const product = await this.productRepository.findOne({
      where: { id: product_id, is_active: true }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product stock is 0
    if (product.stock_quantity === 0) {
      throw new BadRequestException('Product is out of stock');
    }

    if (product.stock_quantity < quantity) {
      throw new BadRequestException(`Cannot add ${quantity} items. Only ${product.stock_quantity} in stock.`);
    }

    // For bulk items, always create a new cart line (allow multiple entries of same product)
    // For regular items, check if item already exists and update quantity
    if (incomingType === 'bulk') {
      console.log('CartService - Adding bulk item:', {
        customer_id: customerId,
        product_id,
        quantity,
        type: 'bulk',
        requested_price_per_unit,
        offered_price_per_unit,
        bulk_min_quantity
      });

      // Bulk items: always create new cart line
      const cartItem = this.cartRepository.create({
        customer_id: customerId,
        product_id,
        quantity,
        type: 'bulk',
        requested_price_per_unit,
        offered_price_per_unit,
        bulk_min_quantity,
        is_active: true,
      });

      await this.cartRepository.save(cartItem);

      console.log('CartService - Bulk item saved:', {
        cart_id: cartItem.id,
        product_id: cartItem.product_id,
        quantity: cartItem.quantity
      });

      return ResponseHelper.success(
        {
          cart_id: cartItem.id,
          product_id: cartItem.product_id,
          quantity: cartItem.quantity,
          type: cartItem.type,
          requested_price_per_unit: cartItem.requested_price_per_unit,
          offered_price_per_unit: cartItem.offered_price_per_unit,
          bulk_min_quantity: cartItem.bulk_min_quantity,
          is_active: cartItem.is_active
        },
        'Bulk item added to cart successfully',
        'Cart'
      );
    }

    // Regular items: check if already exists and update quantity
    const existingCartItem = await this.cartRepository
      .createQueryBuilder('cart')
      .where('cart.customer_id = :customerId', { customerId })
      .andWhere('cart.is_active = true')
      .andWhere('cart.product_id = :productId', { productId: product_id })
      .andWhere('cart.type IS NULL OR cart.type = :regularType', { regularType: 'regular' })
      .getOne();

    const shouldTreatAsExisting = !existingCartItem
      ? false
      : existingCartItem.product_id === product_id;

    if (existingCartItem && !shouldTreatAsExisting) {
      console.error('CartService - existingCartItem mismatch, creating new row instead of updating', {
        requested_product_id: product_id,
        existing_cart_id: existingCartItem.id,
        existing_product_id: existingCartItem.product_id,
        customer_id: customerId,
      });
    }

    if (shouldTreatAsExisting) {
      // Check if item was previously deactivated
      const wasInactive = !existingCartItem.is_active;

      // Do not allow switching type for an existing cart line (keeps cart consistent)
      const existingType = existingCartItem.type || 'regular';
      if (existingType !== incomingType) {
        throw new BadRequestException('Cart contains mixed item types. Please clear your cart and try again.');
      }
      
      if (existingCartItem.is_active) {
        // Update quantity if item is already active
        const newQuantity = existingCartItem.quantity + quantity;
        
        if (product.stock_quantity < newQuantity) {
          throw new BadRequestException(`Cannot update to ${newQuantity} items. Only ${product.stock_quantity} in stock.`);
        }

        existingCartItem.quantity = newQuantity;
      } else {
        // Reactivate item with new quantity (don't add to old quantity)
        if (product.stock_quantity < quantity) {
          throw new BadRequestException(`Cannot add ${quantity} items. Only ${product.stock_quantity} in stock.`);
        }

        existingCartItem.quantity = quantity;
        existingCartItem.is_active = true;
      }
      
      await this.cartRepository.save(existingCartItem);

      return ResponseHelper.success(
        {
          cart_id: existingCartItem.id,
          product_id: existingCartItem.product_id,
          quantity: existingCartItem.quantity,
          type: existingCartItem.type,
          requested_price_per_unit: existingCartItem.requested_price_per_unit,
          offered_price_per_unit: existingCartItem.offered_price_per_unit,
          bulk_min_quantity: existingCartItem.bulk_min_quantity,
          is_active: existingCartItem.is_active
        },
        wasInactive ? 'Item reactivated successfully' : 'Cart item updated successfully',
        'Cart'
      );
    } else {
      // Add new regular item to cart
      const cartItem = this.cartRepository.create({
        customer_id: customerId,
        product_id,
        quantity,
        type: incomingType,
        requested_price_per_unit,
        offered_price_per_unit,
        bulk_min_quantity,
        is_active: true,
      });

      await this.cartRepository.save(cartItem);

      return ResponseHelper.success(
        {
          cart_id: cartItem.id,
          product_id: cartItem.product_id,
          quantity: cartItem.quantity,
          type: cartItem.type,
          requested_price_per_unit: cartItem.requested_price_per_unit,
          offered_price_per_unit: cartItem.offered_price_per_unit,
          bulk_min_quantity: cartItem.bulk_min_quantity,
          is_active: cartItem.is_active
        },
        'Item added to cart successfully',
        'Cart'
      );
    }
  }

  async updateCartItem(customerId: string, cartItemId: string, updateCartDto: UpdateCartDto): Promise<ApiResponse<any>> {
    const { quantity } = updateCartDto;

    // Handle quantity = 0 as remove item
    if (quantity === 0) {
      return this.removeFromCart(customerId, cartItemId);
    }

    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    // Get cart item with product stock
    const cartItem = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoin('products', 'product', 'product.id = cart.product_id')
      .select([
        'cart.id',
        'cart.quantity',
        'cart.customer_id',
        'cart.product_id',
        'product.stock_quantity',
        'product.is_active as product_active',
      ])
      .where('cart.id = :cartItemId', { cartItemId })
      .andWhere('cart.customer_id = :customerId', { customerId })
      .andWhere('cart.is_active = true')
      .getRawOne();

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (!cartItem.product_active) {
      throw new BadRequestException('Product is no longer available');
    }

    if (cartItem.product_stock_quantity < quantity) {
      throw new BadRequestException(`Insufficient stock available. Only ${cartItem.product_stock_quantity} items available.`);
    }

    // Update the cart item
    await this.cartRepository
      .createQueryBuilder()
      .update(CustomerCart)
      .set({ quantity })
      .where('id = :cartItemId', { cartItemId })
      .andWhere('customer_id = :customerId', { customerId })
      .execute();

    return ResponseHelper.success(
      { 
        cartItemId,
        newQuantity: quantity,
        previousQuantity: cartItem.quantity,
        availableStock: cartItem.product_stock_quantity
      },
      'Cart item updated successfully',
      'Cart'
    );
  }

  async removeFromCart(customerId: string, cartItemId: string): Promise<ApiResponse<any>> {
    const cartItem = await this.cartRepository.findOne({
      where: {
        id: cartItemId,
        customer_id: customerId,
        is_active: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Soft delete by setting is_active to false
    cartItem.is_active = false;
    await this.cartRepository.save(cartItem);

    return ResponseHelper.success(
      null,
      'Item removed from cart successfully',
      'Cart'
    );
  }

  async clearCart(customerId: string): Promise<ApiResponse<any>> {
    await this.cartRepository
      .createQueryBuilder()
      .update(CustomerCart)
      .set({ is_active: false })
      .where('customer_id = :customerId', { customerId })
      .andWhere('is_active = true')
      .execute();

    return ResponseHelper.success(
      null,
      'Cart cleared successfully',
      'Cart'
    );
  }
}
