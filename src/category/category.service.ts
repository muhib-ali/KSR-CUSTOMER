import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '../common/helpers/response.helper';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getFeaturedCategories(): Promise<ApiResponse<any>> {
    const rows = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.products', 'product')
      .select('category.id', 'id')
      .addSelect('category.name', 'name')
      .addSelect('COUNT(product.id)', 'productCount')
      .where('category.is_active = :isActive', { isActive: true })
      .andWhere('product.is_active = :productIsActive', { productIsActive: true })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('COUNT(product.id)', 'DESC')
      .limit(4)
      .getRawMany<{ id: string; name: string; productCount: string }>();

    const categories = rows.map((row) => ({
      id: row.id,
      name: row.name,
      productCount: Number(row.productCount) || 0,
    }));

    return ResponseHelper.success(
      categories,
      'Featured categories retrieved successfully',
      'Categories'
    );
  }

  async getAllCategories(): Promise<ApiResponse<any>> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'products')
      .where('products.stock_quantity > 0')
      .orWhere('products.id IS NULL')
      .orderBy('category.name', 'ASC')
      .getMany();

    return ResponseHelper.success(
      categories,
      'Categories retrieved successfully',
      'Categories'
    );
  }

  async getCategoryById(id: string): Promise<ApiResponse<any>> {
    const category = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'products')
      .where('category.id = :id', { id })
      .getOne();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return ResponseHelper.success(
      category,
      'Category retrieved successfully',
      'Categories'
    );
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<any>> {
    const category = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'products')
      .where('category.slug = :slug', { slug })
      .getOne();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return ResponseHelper.success(
      category,
      'Category retrieved successfully',
      'Categories'
    );
  }
}
