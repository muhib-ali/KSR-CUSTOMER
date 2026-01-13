import { Injectable, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { ReviewResponseDto, ReviewSummaryDto } from './dto/review-response.dto';
import { ResponseHelper } from '../common/helpers/response.helper';
import { ApiResponse, PaginatedApiResponse } from '../common/interfaces/api-response.interface';
import { ReviewStatus } from '../entities/review-status.enum';
import { OrderStatus } from '../entities/order-status.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Create a new review (customer endpoint)
   * Validates verified purchase before allowing review
   */
  async create(userId: string, createReviewDto: CreateReviewDto): Promise<ApiResponse<ReviewResponseDto>> {
    const { productId, rating, comment } = createReviewDto;

    // Check if product exists
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: { product_id: productId, user_id: userId },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Verify purchase: check if user has an accepted order containing this product
    const verifiedOrder = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.order_items', 'order_item')
      .where('order.user_id = :userId', { userId })
      .andWhere('order.status = :status', { status: OrderStatus.ACCEPTED })
      .andWhere('order_item.product_id = :productId', { productId })
      .getOne();

    if (!verifiedOrder) {
      throw new ForbiddenException('You can only review products from your accepted orders');
    }

    // Create the review
    const review = this.reviewRepository.create({
      product_id: productId,
      user_id: userId,
      order_id: verifiedOrder.id,
      rating,
      comment,
      status: ReviewStatus.PENDING,
      is_verified_purchase: true,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Get customer info for response
    const customer = await this.customerRepository.findOne({ where: { id: userId } });

    const responseDto: ReviewResponseDto = {
      id: savedReview.id,
      productId: savedReview.product_id,
      userId: savedReview.user_id,
      orderId: savedReview.order_id,
      rating: savedReview.rating,
      comment: savedReview.comment,
      status: savedReview.status,
      isVerifiedPurchase: savedReview.is_verified_purchase,
      customerName: customer?.fullname || 'Anonymous',
      createdAt: savedReview.created_at,
      updatedAt: savedReview.updated_at,
    };

    return ResponseHelper.success(
      responseDto,
      'Review submitted successfully. It will be visible after admin approval.',
      'Review Submitted'
    );
  }

  /**
   * Get approved reviews for a product (public endpoint)
   * ONLY returns approved reviews
   */
  async getProductReviews(getReviewsDto: GetReviewsDto): Promise<PaginatedApiResponse<ReviewResponseDto>> {
    const { page = 1, limit = 10, productId, rating, verified } = getReviewsDto;

    if (!productId) {
      throw new BadRequestException('Product ID is required');
    }

    const skip = (page - 1) * limit;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.product_id = :productId', { productId })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED }); // CRITICAL: Only approved

    // Apply optional filters
    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    if (verified !== undefined) {
      queryBuilder.andWhere('review.is_verified_purchase = :verified', { verified });
    }

    queryBuilder
      .orderBy('review.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    const reviewDtos: ReviewResponseDto[] = reviews.map(review => ({
      id: review.id,
      productId: review.product_id,
      userId: review.user_id,
      orderId: review.order_id,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      isVerifiedPurchase: review.is_verified_purchase,
      customerName: review.user?.fullname || 'Anonymous',
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    }));

    return ResponseHelper.paginated(
      reviewDtos,
      page,
      limit,
      total,
      'reviews',
      'Reviews retrieved successfully',
      'Reviews'
    );
  }

  /**
   * Get customer's own reviews (all statuses)
   */
  async getMyReviews(userId: string, getReviewsDto: GetReviewsDto): Promise<PaginatedApiResponse<ReviewResponseDto>> {
    const { page = 1, limit = 10 } = getReviewsDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.product', 'product')
      .where('review.user_id = :userId', { userId })
      .orderBy('review.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    const customer = await this.customerRepository.findOne({ where: { id: userId } });

    const reviewDtos: ReviewResponseDto[] = reviews.map(review => ({
      id: review.id,
      productId: review.product_id,
      userId: review.user_id,
      orderId: review.order_id,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      isVerifiedPurchase: review.is_verified_purchase,
      customerName: customer?.fullname || 'Anonymous',
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    }));

    return ResponseHelper.paginated(
      reviewDtos,
      page,
      limit,
      total,
      'reviews',
      'Your reviews retrieved successfully',
      'My Reviews'
    );
  }

  /**
   * Get review summary/statistics for a product
   */
  async getProductReviewSummary(productId: string): Promise<ApiResponse<ReviewSummaryDto>> {
    // Only count approved reviews
    const reviews = await this.reviewRepository.find({
      where: { product_id: productId, status: ReviewStatus.APPROVED },
    });

    if (reviews.length === 0) {
      return ResponseHelper.success(
        {
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        },
        'No reviews yet',
        'Review Summary'
      );
    }

    const totalReviews = reviews.length;
    const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = parseFloat((sumRatings / totalReviews).toFixed(2));

    const ratingBreakdown: { [key: string]: number } = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    };

    reviews.forEach(review => {
      ratingBreakdown[review.rating.toString()]++;
    });

    const summary: ReviewSummaryDto = {
      averageRating,
      totalReviews,
      ratingBreakdown,
    };

    return ResponseHelper.success(summary, 'Review summary retrieved successfully', 'Review Summary');
  }
}
