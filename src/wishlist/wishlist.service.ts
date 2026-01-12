import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { WishlistItemDto } from './dto/wishlist-response.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async addToWishlist(customerId: string, addToWishlistDto: AddToWishlistDto): Promise<Wishlist> {
    // Check if customer exists
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if product exists
    const product = await this.productRepository.findOne({ where: { id: addToWishlistDto.product_id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is already in wishlist
    const existingWishlistItem = await this.wishlistRepository.findOne({
      where: {
        customer_id: customerId,
        product_id: addToWishlistDto.product_id,
      },
    });

    if (existingWishlistItem) {
      throw new BadRequestException('Product already in wishlist');
    }

    // Create new wishlist item
    const wishlistItem = this.wishlistRepository.create({
      customer_id: customerId,
      product_id: addToWishlistDto.product_id,
    });

    return await this.wishlistRepository.save(wishlistItem);
  }

  async removeFromWishlist(customerId: string, productId: string): Promise<void> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: {
        customer_id: customerId,
        product_id: productId,
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.wishlistRepository.remove(wishlistItem);
  }

  async getWishlist(customerId: string): Promise<WishlistItemDto[]> {
    const wishlistItems = await this.wishlistRepository.find({
      where: { customer_id: customerId },
      relations: ['product', 'product.category', 'product.brand', 'product.images'],
      order: { created_at: 'DESC' },
    });

    return wishlistItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product: item.product,
      added_at: item.created_at,
    }));
  }

  async checkInWishlist(customerId: string, productId: string): Promise<{ isInWishlist: boolean }> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: {
        customer_id: customerId,
        product_id: productId,
      },
    });

    return { isInWishlist: !!wishlistItem };
  }

  async getWishlistCount(customerId: string): Promise<{ count: number }> {
    const count = await this.wishlistRepository.count({
      where: { customer_id: customerId },
    });

    return { count };
  }
}
