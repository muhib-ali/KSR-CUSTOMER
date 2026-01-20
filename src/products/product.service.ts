import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '../common/helpers/response.helper';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { GetProductsDto } from './dto/get-products.dto';
import { Product } from '../entities/product.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Review } from '../entities/review.entity';
import { BulkPrice } from '../entities/bulk-price.entity';
import { OrderStatus } from '../entities/order-status.enum';
import { ReviewStatus } from '../entities/review-status.enum';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(BulkPrice)
    private bulkPriceRepository: Repository<BulkPrice>,
  ) {}

  async getAllProducts(query: GetProductsDto): Promise<ApiResponse<any>> {
    const {
      page = 1,
      limit = 20,
      category,
      brand,
      stock = 'all',
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search,
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images');

    // Stock filter (shop page needs ability to show in-stock/out-of-stock/both)
    if (stock === 'in') {
      queryBuilder.where('product.stock_quantity > 0');
    } else if (stock === 'out') {
      queryBuilder.where('product.stock_quantity <= 0');
    }

    // Apply filters
    if (category) {
      // Check if it's a UUID format (contains hyphens and length > 20)
      if (category.includes('-') && category.length > 20) {
        // It's a UUID, filter by ID
        queryBuilder.andWhere('category.id = :categoryId', { categoryId: category });
      } else {
        // It's a name, filter by name
        queryBuilder.andWhere('category.name = :categoryName', { categoryName: category });
      }
    }

    if (brand) {
      const brandValues = brand
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);

      if (brandValues.length === 1) {
        const brandValue = brandValues[0];
        // Check if it's a UUID format (contains hyphens and length > 20)
        if (brandValue.includes('-') && brandValue.length > 20) {
          // It's a UUID, cast it properly
          queryBuilder.andWhere('brand.id = :brandId', { brandId: brandValue });
        } else {
          // It's a name, filter by name
          queryBuilder.andWhere('brand.name = :brandName', { brandName: brandValue });
        }
      } else if (brandValues.length > 1) {
        // Separate UUIDs and names
        const uuids = brandValues.filter(v => v.includes('-') && v.length > 20);
        const names = brandValues.filter(v => !v.includes('-') || v.length <= 20);
        
        const conditions = [];
        const parameters: any = {};
        
        if (uuids.length > 0) {
          conditions.push('brand.id IN (:...brandIds)');
          parameters.brandIds = uuids;
        }
        
        if (names.length > 0) {
          conditions.push('brand.name IN (:...brandNames)');
          parameters.brandNames = names;
        }
        
        if (conditions.length > 0) {
          queryBuilder.andWhere(`(${conditions.join(' OR ')})`, parameters);
        }
      }
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('CAST(product.price AS DECIMAL) >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('CAST(product.price AS DECIMAL) <= :maxPrice', { maxPrice });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.title ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const products = await queryBuilder
      .skip(skip)
      .take(limit)
      .getMany();

    return ResponseHelper.success(
      {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      'Products retrieved successfully',
      'Products'
    );
  }

  async getFeaturedProducts(): Promise<ApiResponse<any>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.stock_quantity > 0')
      .andWhere(
        '(product.created_at >= :thirtyDaysAgo OR product.stock_quantity > :highStock OR product.price > :premiumPrice)',
        { thirtyDaysAgo, highStock: 10, premiumPrice: 1000 }
      )
      .orderBy('product.created_at', 'DESC')
      .limit(12)
      .getMany();

    return ResponseHelper.success(
      products,
      'Featured products retrieved successfully',
      'Products'
    );
  }

  async getNewArrivals(): Promise<ApiResponse<any>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get products first, then manually load images
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('product.created_at >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('product.stock_quantity > 0')
      .orderBy('product.created_at', 'DESC')
      .limit(8)
      .getMany();

    // Load images for each product separately
    const productIds = products.map(p => p.id);
    const images = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.images', 'images')
      .select(['product.id', 'images.id', 'images.url', 'images.file_name', 'images.sort_order'])
      .where('product.id IN (:...productIds)', { productIds })
      .orderBy('images.sort_order', 'ASC')
      .getRawMany();

    // Group images by product ID
    const imagesByProduct = {};
    images.forEach(img => {
      if (!imagesByProduct[img.product_id]) {
        imagesByProduct[img.product_id] = [];
      }
      imagesByProduct[img.product_id].push({
        id: img.id,
        url: img.url,
        file_name: img.file_name,
        sort_order: img.sort_order,
        product_id: img.product_id,
        is_active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      });
    });

    // Attach images to products
    const productsWithImages = products.map(product => ({
      ...product,
      images: imagesByProduct[product.id] || []
    }));

    return ResponseHelper.success(
      productsWithImages,
      'New arrivals retrieved successfully',
      'Products'
    );
  }

  async getBestSellers(): Promise<ApiResponse<any>> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.stock_quantity > 10')
      .andWhere('product.stock_quantity > 0')
      .orderBy('product.stock_quantity', 'DESC')
      .limit(8)
      .getMany();

    return ResponseHelper.success(
      products,
      'Best sellers retrieved successfully',
      'Products'
    );
  }

  async getProductById(id: string): Promise<ApiResponse<any>> {
    // Get product first, then manually load images
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.id = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Load images for this product separately
    const images = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.images', 'images')
      .select([
        'product.id as product_id',
        'images.id as id',
        'images.url as url',
        'images.file_name as file_name',
        'images.sort_order as sort_order',
        'images.is_active as is_active',
        'images.created_by as created_by',
        'images.updated_by as updated_by',
        'images.created_at as created_at',
        'images.updated_at as updated_at'
      ])
      .where('product.id = :id', { id })
      .orderBy('images.sort_order', 'ASC')
      .getRawMany();

    // Group images by product ID
    const imagesByProduct = {};
    images.forEach(img => {
      if (!imagesByProduct[img.product_id]) {
        imagesByProduct[img.product_id] = [];
      }
      imagesByProduct[img.product_id].push({
        id: img.id,
        url: img.url,
        file_name: img.file_name,
        sort_order: img.sort_order,
        product_id: img.product_id,
        is_active: img.is_active,
        created_by: img.created_by,
        updated_by: img.updated_by,
        created_at: img.created_at,
        updated_at: img.updated_at
      });
    });

    // Attach images to product
    const productWithImages = {
      ...product,
      images: imagesByProduct[product.id] || []
    };

    return ResponseHelper.success(
      productWithImages,
      'Product retrieved successfully',
      'Products'
    );
  }

  async getProductBySlug(slug: string): Promise<ApiResponse<any>> {
    // Get product first, then manually load images (using id as slug since slug field doesn't exist)
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.id = :slug', { slug })
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Load images for this product separately
    const images = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.images', 'images')
      .select([
        'product.id as product_id',
        'images.id as id',
        'images.url as url',
        'images.file_name as file_name',
        'images.sort_order as sort_order',
        'images.is_active as is_active',
        'images.created_by as created_by',
        'images.updated_by as updated_by',
        'images.created_at as created_at',
        'images.updated_at as updated_at'
      ])
      .where('product.id = :id', { id: product.id })
      .orderBy('images.sort_order', 'ASC')
      .getRawMany();

    // Group images by product ID
    const imagesByProduct = {};
    images.forEach(img => {
      if (!imagesByProduct[img.product_id]) {
        imagesByProduct[img.product_id] = [];
      }
      imagesByProduct[img.product_id].push({
        id: img.id,
        url: img.url,
        file_name: img.file_name,
        sort_order: img.sort_order,
        product_id: img.product_id,
        is_active: img.is_active,
        created_by: img.created_by,
        updated_by: img.updated_by,
        created_at: img.created_at,
        updated_at: img.updated_at
      });
    });

    // Attach images to product
    const productWithImages = {
      ...product,
      images: imagesByProduct[product.id] || []
    };

    return ResponseHelper.success(
      productWithImages,
      'Product retrieved successfully',
      'Products'
    );
  }

  async getProductsByCategory(categoryId: string): Promise<ApiResponse<any>> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.category_id = :categoryId', { categoryId })
      .andWhere('product.stock_quantity > 0')
      .orderBy('product.created_at', 'DESC')
      .getMany();

    return ResponseHelper.success(
      products,
      'Products by category retrieved successfully',
      'Products'
    );
  }

  async getProductsByBrand(brandId: string): Promise<ApiResponse<any>> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.brand_id = :brandId', { brandId })
      .andWhere('product.stock_quantity > 0')
      .orderBy('product.created_at', 'DESC')
      .getMany();

    return ResponseHelper.success(
      products,
      'Products by brand retrieved successfully',
      'Products'
    );
  }

  async getRelatedProducts(productId: string): Promise<ApiResponse<any>> {
    // First get the current product to find its category
    const currentProduct = await this.productRepository
      .createQueryBuilder('product')
      .where('product.id = :productId', { productId })
      .getOne();

    if (!currentProduct) {
      throw new NotFoundException('Product not found');
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.category_id = :categoryId', { categoryId: currentProduct.category_id })
      .andWhere('product.id != :productId', { productId })
      .andWhere('product.stock_quantity > 0')
      .orderBy('RANDOM()')
      .limit(6)
      .getMany();

    return ResponseHelper.success(
      products,
      'Related products retrieved successfully',
      'Products'
    );
  }

  async getBestProducts(options?: {
    limit?: number;
    days?: number;
    minReviews?: number;
  }): Promise<ApiResponse<any>> {
    const limit = Math.min(Math.max(options?.limit ?? 2, 1), 20);
    const days = Math.min(Math.max(options?.days ?? 30, 1), 365);
    const minReviews = Math.min(Math.max(options?.minReviews ?? 3, 0), 1000);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // 1) Sold quantity per product from ACCEPTED orders
    const salesRows = await this.orderItemRepository
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .select('oi.product_id', 'product_id')
      .addSelect('SUM(oi.quantity)', 'sold_qty')
      .where('o.status = :status', { status: OrderStatus.ACCEPTED })
      .andWhere('o.created_at >= :since', { since })
      .groupBy('oi.product_id')
      .getRawMany<{ product_id: string; sold_qty: string }>();

    if (!salesRows.length) {
      return ResponseHelper.success(
        [],
        'Best products retrieved successfully',
        'Products'
      );
    }

    const salesMap = new Map<string, number>();
    let maxSoldQty = 0;
    for (const r of salesRows) {
      const soldQty = Number(r.sold_qty ?? 0);
      salesMap.set(r.product_id, soldQty);
      if (soldQty > maxSoldQty) maxSoldQty = soldQty;
    }

    // 2) Ratings per product from APPROVED reviews (all-time; can be changed later)
    const ratingRows = await this.reviewRepository
      .createQueryBuilder('rev')
      .select('rev.product_id', 'product_id')
      .addSelect('AVG(rev.rating)', 'avg_rating')
      .addSelect('COUNT(rev.id)', 'review_count')
      .where('rev.status = :status', { status: ReviewStatus.APPROVED })
      .andWhere('rev.product_id IN (:...productIds)', {
        productIds: Array.from(salesMap.keys()),
      })
      .groupBy('rev.product_id')
      .getRawMany<{ product_id: string; avg_rating: string; review_count: string }>();

    const ratingMap = new Map<string, { avg: number; count: number }>();
    for (const r of ratingRows) {
      ratingMap.set(r.product_id, {
        avg: Number(r.avg_rating ?? 0),
        count: Number(r.review_count ?? 0),
      });
    }

    // 3) Compute score
    const candidates = Array.from(salesMap.entries())
      .map(([productId, soldQty]) => {
        const rating = ratingMap.get(productId);
        const avgRating = rating?.avg ?? 0;
        const reviewCount = rating?.count ?? 0;

        if (minReviews > 0 && reviewCount < minReviews) return null;

        const salesScore = maxSoldQty > 0 ? soldQty / maxSoldQty : 0;
        const ratingScore = avgRating / 5;
        const confidenceScore = minReviews > 0 ? Math.min(1, reviewCount / minReviews) : 1;
        const score = 0.65 * salesScore + 0.30 * ratingScore + 0.05 * confidenceScore;

        return {
          productId,
          soldQty,
          avgRating,
          reviewCount,
          score,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    // Fallback if thresholds are too strict
    const finalCandidates = candidates.length
      ? candidates
      : Array.from(salesMap.entries()).map(([productId, soldQty]) => ({
          productId,
          soldQty,
          avgRating: ratingMap.get(productId)?.avg ?? 0,
          reviewCount: ratingMap.get(productId)?.count ?? 0,
          score: maxSoldQty > 0 ? soldQty / maxSoldQty : 0,
        }));

    finalCandidates.sort((a, b) =>
      b.score - a.score ||
      b.soldQty - a.soldQty ||
      b.avgRating - a.avgRating ||
      b.reviewCount - a.reviewCount
    );

    const top = finalCandidates.slice(0, limit);
    const topIds = top.map((t) => t.productId);

    // 4) Fetch product details
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.id IN (:...ids)', { ids: topIds })
      .andWhere('product.stock_quantity > 0')
      .getMany();

    const productMap = new Map(products.map((p) => [p.id, p]));
    const result = top
      .map((t) => {
        const product = productMap.get(t.productId);
        if (!product) return null;
        return {
          ...product,
          soldQty: t.soldQty,
          avgRating: Number(t.avgRating.toFixed(2)),
          reviewCount: t.reviewCount,
          score: Number(t.score.toFixed(4)),
          isHot: true,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    return ResponseHelper.success(
      result,
      'Best products retrieved successfully',
      'Products'
    );
  }

  async getProductBulkPricing(productId: string): Promise<ApiResponse<any>> {
    const bulkPrices = await this.bulkPriceRepository
      .createQueryBuilder('bulk_price')
      .where('bulk_price.product_id = :productId', { productId })
      .andWhere('bulk_price.is_active = :isActive', { isActive: true })
      .orderBy('bulk_price.quantity', 'ASC')
      .getMany();

    return ResponseHelper.success(
      bulkPrices,
      'Bulk pricing retrieved successfully',
      'Bulk Pricing'
    );
  }

  async getProductWithBulkPricingBySku(sku: string): Promise<ApiResponse<any>> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.sku = :sku', { sku })
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const bulkPrices = await this.bulkPriceRepository
      .createQueryBuilder('bulk_price')
      .where('bulk_price.product_id = :productId', { productId: product.id })
      .andWhere('bulk_price.is_active = :isActive', { isActive: true })
      .orderBy('bulk_price.quantity', 'ASC')
      .getMany();

    return ResponseHelper.success(
      {
        product,
        bulkPricing: bulkPrices,
      },
      'Product with bulk pricing retrieved successfully',
      'Product'
    );
  }
}
