import { Controller, Post, Get, Body, Query, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { ReviewResponseDto, ReviewSummaryDto } from './dto/review-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a product review',
    description: 'Submit a review for a product. Only verified purchases (accepted orders) can be reviewed. Each user can review a product only once.',
  })
  @ApiResponse({
    status: 201,
    description: 'Review submitted successfully. Status will be pending until admin approval.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Product not found or invalid data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only review products from your accepted orders',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - You have already reviewed this product',
  })
  async create(@Req() req: any, @Body(ValidationPipe) createReviewDto: CreateReviewDto) {
    const userId = req.user.id;
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get('product')
  @ApiOperation({
    summary: 'Get approved reviews for a product',
    description: 'Retrieve paginated approved reviews for a specific product. Only approved reviews are returned (pending/rejected are hidden). Use this endpoint for product pages, review widgets, or review sections.',
  })
  @ApiQuery({
    name: 'productId',
    required: true,
    description: 'Product ID to get reviews for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 50)',
    example: 10,
  })
  @ApiQuery({
    name: 'rating',
    required: false,
    description: 'Filter by rating (1-5)',
    example: 5,
  })
  @ApiQuery({
    name: 'verified',
    required: false,
    description: 'Filter verified purchase reviews only',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
    type: [ReviewResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Product ID is required or invalid parameters',
  })
  async getProductReviews(@Query(ValidationPipe) getReviewsDto: GetReviewsDto) {
    return this.reviewsService.getProductReviews(getReviewsDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get my reviews',
    description: 'Retrieve all reviews submitted by the authenticated customer (all statuses: pending, approved, rejected).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Your reviews retrieved successfully',
    type: [ReviewResponseDto],
  })
  async getMyReviews(@Req() req: any, @Query(ValidationPipe) getReviewsDto: GetReviewsDto) {
    const userId = req.user.id;
    return this.reviewsService.getMyReviews(userId, getReviewsDto);
  }

  @Get('product/summary')
  @ApiOperation({
    summary: 'Get product review summary',
    description: 'Get aggregated review statistics for a product (average rating, total reviews, rating breakdown).',
  })
  @ApiQuery({
    name: 'productId',
    required: true,
    description: 'Product ID to get summary for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Review summary retrieved successfully',
    type: ReviewSummaryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Product ID is required',
  })
  async getProductReviewSummary(@Query('productId') productId: string) {
    return this.reviewsService.getProductReviewSummary(productId);
  }
}
