import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Blog } from '../entities/blog.entity';
import { BlogQueryDto } from './dto/blog-query.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  async findAll(query: BlogQueryDto): Promise<{ blogs: Blog[]; total: number }> {
    const { search, is_active, page = 1, limit = 10, sort_by = 'created_at', order = 'DESC' } = query;
    
    const where: FindOptionsWhere<Blog> = {};

    // Only return active blogs for public API
    where.is_active = true;

    if (search) {
      where.heading = Like(`%${search}%`);
    }

    const [blogs, total] = await this.blogRepository.findAndCount({
      where,
      order: {
        [sort_by]: order.toUpperCase(),
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    return { blogs, total };
  }

  async findOne(id: string): Promise<Blog> {
    const blog = await this.blogRepository.findOne({
      where: { 
        id, 
        is_active: true // Only return active blogs
      },
    });

    if (!blog) {
      throw new Error('Blog not found');
    }

    return blog;
  }
}
