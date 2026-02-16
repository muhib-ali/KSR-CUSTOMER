import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from '../entities/category.entity';
import { Subcategory } from '../entities/subcategory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Subcategory,
    ]),
  ],
  controllers: [
    CategoryController,
  ],
  providers: [
    CategoryService,
  ],
  exports: [
    CategoryService,
  ],
})
export class CategoryModule {}
