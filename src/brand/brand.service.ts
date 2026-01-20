import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '../common/helpers/response.helper';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { Brand } from '../entities/brand.entity';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
  ) {}

  async getAllBrands(): Promise<ApiResponse<any>> {
    const brands = await this.brandRepository
      .createQueryBuilder('brand')
      .where('brand.is_active = :isActive', { isActive: true })
      .orderBy('brand.name', 'ASC')
      .getMany();

    return ResponseHelper.success(
      { brands },
      'Brands retrieved successfully',
      'Brands'
    );
  }

  async getBrandById(id: string): Promise<ApiResponse<any>> {
    const brand = await this.brandRepository
      .createQueryBuilder('brand')
      .leftJoinAndSelect('brand.products', 'products')
      .where('brand.id = :id', { id })
      .getOne();

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return ResponseHelper.success(
      brand,
      'Brand retrieved successfully',
      'Brands'
    );
  }

  async getBrandBySlug(slug: string): Promise<ApiResponse<any>> {
    const brand = await this.brandRepository
      .createQueryBuilder('brand')
      .leftJoinAndSelect('brand.products', 'products')
      .where('brand.slug = :slug', { slug })
      .getOne();

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return ResponseHelper.success(
      brand,
      'Brand retrieved successfully',
      'Brands'
    );
  }
}
