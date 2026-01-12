import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { ResponseHelper } from '../common/helpers/response.helper';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { GetProductsDto } from './dto/get-products.dto';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
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
      queryBuilder.andWhere('category.slug = :category', { category });
    }

    if (brand) {
      const brandSlugs = brand
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);

      if (brandSlugs.length === 1) {
        queryBuilder.andWhere('brand.slug = :brand', { brand: brandSlugs[0] });
      } else if (brandSlugs.length > 1) {
        queryBuilder.andWhere('brand.slug IN (:...brands)', { brands: brandSlugs });
      }
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
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

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.created_at >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('product.stock_quantity > 0')
      .orderBy('product.created_at', 'DESC')
      .limit(8)
      .getMany();

    return ResponseHelper.success(
      products,
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
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.id = :id', { id })
      .andWhere('product.stock_quantity > 0')
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return ResponseHelper.success(
      product,
      'Product retrieved successfully',
      'Products'
    );
  }

  async getProductBySlug(slug: string): Promise<ApiResponse<any>> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.slug = :slug', { slug })
      .andWhere('product.stock_quantity > 0')
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return ResponseHelper.success(
      product,
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
}
