# Reviews API Documentation - KSR-CUSTOMER

## Overview
Complete reviews system implementation for customer product reviews with admin moderation.

## Features Implemented
- ✅ **Verified Purchase Only**: Users can only review products from their accepted orders
- ✅ **One Review Per Product**: Unique constraint prevents duplicate reviews
- ✅ **Admin Moderation**: Reviews default to "pending" status, visible only after approval
- ✅ **Comprehensive Swagger Documentation**: All endpoints fully documented
- ✅ **Rating System**: 1-5 star ratings with aggregated statistics
- ✅ **Pagination Support**: Efficient data retrieval for large datasets

## Database Schema

### Reviews Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Indexes
CREATE INDEX idx_reviews_product_status ON reviews(product_id, status);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
```

## API Endpoints

### 1. Create Review (Customer)
**POST** `/reviews`

**Auth Required**: Yes (JWT Bearer Token)

**Request Body**:
```json
{
  "productId": "123e4567-e89b-12d3-a456-426614174000",
  "rating": 5,
  "comment": "Great product! Highly recommended. The quality is excellent."
}
```

**Validation Rules**:
- `productId`: Required, valid UUID
- `rating`: Required, integer 1-5
- `comment`: Required, minimum 10 characters

**Success Response** (201):
```json
{
  "statusCode": 201,
  "status": true,
  "message": "Review submitted successfully. It will be visible after admin approval.",
  "heading": "Review Submitted",
  "data": {
    "id": "review-uuid",
    "productId": "product-uuid",
    "userId": "user-uuid",
    "orderId": "order-uuid",
    "rating": 5,
    "comment": "Great product!...",
    "status": "pending",
    "isVerifiedPurchase": true,
    "customerName": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Product not found or invalid data
- `403 Forbidden`: User hasn't purchased this product in an accepted order
- `409 Conflict`: User already reviewed this product

**Business Logic**:
1. Validates product exists
2. Checks if user already reviewed (unique constraint)
3. Verifies purchase: queries orders table for accepted order containing product
4. Creates review with `status=pending` and `is_verified_purchase=true`
5. Returns success message indicating admin approval needed

---

### 2. Get Product Reviews (Public)
**GET** `/reviews/product?productId={uuid}&page={num}&limit={num}`

**Auth Required**: No

**Query Parameters**:
- `productId` (required): Product UUID
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10

**Success Response** (200):
```json
{
  "statusCode": 200,
  "status": true,
  "message": "Reviews retrieved successfully",
  "heading": "Reviews",
  "data": {
    "reviews": [
      {
        "id": "review-uuid",
        "productId": "product-uuid",
        "userId": "user-uuid",
        "orderId": "order-uuid",
        "rating": 5,
        "comment": "Excellent product!",
        "status": "approved",
        "isVerifiedPurchase": true,
        "customerName": "John Doe",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15,
      "hasNext": true,
      "hasPrev": false,
      "nextPage": 2,
      "prevPage": null
    }
  }
}
```

**Important**: This endpoint **ONLY** returns reviews with `status='approved'`. Pending and rejected reviews are never exposed.

---

### 3. Get My Reviews (Customer)
**GET** `/reviews/my?page={num}&limit={num}`

**Auth Required**: Yes (JWT Bearer Token)

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10

**Success Response** (200):
```json
{
  "statusCode": 200,
  "status": true,
  "message": "Your reviews retrieved successfully",
  "heading": "My Reviews",
  "data": {
    "reviews": [
      {
        "id": "review-uuid",
        "productId": "product-uuid",
        "userId": "user-uuid",
        "orderId": "order-uuid",
        "rating": 5,
        "comment": "Great product!",
        "status": "pending",
        "isVerifiedPurchase": true,
        "customerName": "John Doe",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

**Note**: Returns all reviews by the authenticated user (all statuses: pending, approved, rejected).

---

### 4. Get Product Review Summary
**GET** `/reviews/product/summary?productId={uuid}`

**Auth Required**: No

**Query Parameters**:
- `productId` (required): Product UUID

**Success Response** (200):
```json
{
  "statusCode": 200,
  "status": true,
  "message": "Review summary retrieved successfully",
  "heading": "Review Summary",
  "data": {
    "averageRating": 4.5,
    "totalReviews": 150,
    "ratingBreakdown": {
      "5": 100,
      "4": 30,
      "3": 15,
      "2": 3,
      "1": 2
    }
  }
}
```

**Note**: Only counts approved reviews in statistics.

---

## Testing with Swagger

1. Start the KSR-CUSTOMER backend:
   ```bash
   cd KSR-CUSTOMER
   npm run start:dev
   ```

2. Open Swagger UI:
   ```
   http://localhost:3000/api
   ```

3. Navigate to **Reviews** section

4. Test flow:
   - **Authenticate**: Use `/auth/login` to get JWT token
   - **Click "Authorize"** button and paste token
   - **Create Review**: POST `/reviews` with productId from an accepted order
   - **View Reviews**: GET `/reviews/product?productId=xxx`
   - **View Summary**: GET `/reviews/product/summary?productId=xxx`

---

## Migration

Run migration to create reviews table:
```bash
cd KSR-CUSTOMER
npm run migration:run
```

Migration file: `migrations/1757600000000-CreateReviews.ts`

---

## Security & Validation

### Verified Purchase Logic
```typescript
// Service checks:
1. Product exists
2. User hasn't already reviewed (unique constraint)
3. User has an order with status='accepted' containing the product
4. If all pass → create review with status='pending'
```

### Data Integrity
- Foreign keys with CASCADE/SET NULL
- Unique constraint on (product_id, user_id)
- Indexes for query performance
- Rating validation (1-5)
- Comment minimum length (10 chars)

### Privacy
- Customer names shown in reviews
- Only approved reviews visible publicly
- Users can see their own pending/rejected reviews

---

## Next Steps (Admin Side)

To complete the reviews system, implement admin endpoints:
- `GET /admin/reviews` - List all reviews with filters
- `PATCH /admin/reviews/:id/approve` - Approve review
- `PATCH /admin/reviews/:id/reject` - Reject review

---

## Summary

✅ **Backend Complete**: Full reviews module with verified purchase, moderation, and Swagger docs
📝 **Next**: Customer-frontend UI for order detail page + product reviews display
🔒 **Security**: Only approved reviews visible, verified purchases only
📊 **Performance**: Indexed queries, pagination support
