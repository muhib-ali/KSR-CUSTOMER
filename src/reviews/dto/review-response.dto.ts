import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '../../entities/review-status.enum';

export class ReviewResponseDto {
  @ApiProperty({
    description: 'Review ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  productId: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  userId: string;

  @ApiPropertyOptional({
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  orderId?: string;

  @ApiProperty({
    description: 'Rating (1-5)',
    example: 5,
  })
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Great product! Highly recommended.',
  })
  comment: string;

  @ApiProperty({
    description: 'Review status',
    enum: ReviewStatus,
    example: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @ApiProperty({
    description: 'Whether this is a verified purchase',
    example: true,
  })
  isVerifiedPurchase: boolean;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
  })
  customerName: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class ReviewSummaryDto {
  @ApiProperty({
    description: 'Average rating',
    example: 4.5,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Total number of reviews',
    example: 150,
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Rating breakdown by stars',
    example: {
      '5': 100,
      '4': 30,
      '3': 15,
      '2': 3,
      '1': 2,
    },
  })
  ratingBreakdown: {
    [key: string]: number;
  };
}
