import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '../common/helpers/response.helper';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { Category } from '../entities/category.entity';
import { Subcategory } from '../entities/subcategory.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,
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
      .leftJoinAndSelect(
        'category.subcategories',
        'subcategories',
        'subcategories.is_active = :subActive',
        { subActive: true },
      )
      .where('category.is_active = :isActive', { isActive: true })
      .orderBy('category.name', 'ASC')
      .addOrderBy('subcategories.name', 'ASC')
      .getMany();

    return ResponseHelper.success(
      { categories },
      'Categories retrieved successfully',
      'Categories'
    );
  }

  async getSubcategoriesByCategoryId(categoryId: string): Promise<ApiResponse<any>> {
    const subcategories = await this.subcategoryRepository.find({
      where: { cat_id: categoryId, is_active: true },
      order: { name: 'ASC' },
      select: ['id', 'name', 'description', 'cat_id'],
    });

    return ResponseHelper.success(
      { subcategories },
      'Subcategories retrieved successfully',
      'Subcategories'
    );
  }

  async getCategoryById(id: string): Promise<ApiResponse<any>> {
    const category = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect(
        'category.subcategories',
        'subcategories',
        'subcategories.is_active = :subActive',
        { subActive: true },
      )
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
      .leftJoinAndSelect(
        'category.subcategories',
        'subcategories',
        'subcategories.is_active = :subActive',
        { subActive: true },
      )
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
