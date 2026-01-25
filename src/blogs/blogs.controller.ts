import { Controller, Get, Param, Query, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { BlogQueryDto } from './dto/blog-query.dto';
import { Blog } from '../entities/blog.entity';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all active blogs',
    description: 'Retrieve a paginated list of all active blog posts. Supports search, sorting, and pagination.'
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: 'Search blogs by heading',
    example: 'technology'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Number of blogs per page',
    example: 10
  })
  @ApiQuery({ 
    name: 'sort_by', 
    required: false, 
    description: 'Field to sort by',
    example: 'created_at',
    enum: ['created_at', 'updated_at', 'heading']
  })
  @ApiQuery({ 
    name: 'order', 
    required: false, 
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Blogs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        blogs: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Blog'
          }
        },
        total: {
          type: 'number',
          example: 25
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getAllBlogs(@Query() query: BlogQueryDto) {
    try {
      const { blogs, total } = await this.blogsService.findAll(query);
      
      return {
        success: true,
        message: 'Blogs retrieved successfully',
        data: {
          blogs,
          pagination: {
            page: Number(query.page) || 1,
            limit: Number(query.limit) || 10,
            total,
            totalPages: Math.ceil(total / (Number(query.limit) || 10)),
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve blogs',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get blog by ID',
    description: 'Retrieve a specific active blog post by its unique ID.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Blog ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Blog retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Blog retrieved successfully' },
        data: {
          $ref: '#/components/schemas/Blog'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  @ApiResponse({ status: 400, description: 'Invalid blog ID format' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getBlogById(@Param('id') id: string) {
    try {
      const blog = await this.blogsService.findOne(id);
      
      return {
        success: true,
        message: 'Blog retrieved successfully',
        data: blog,
      };
    } catch (error) {
      if (error.message === 'Blog not found') {
        throw new HttpException(
          {
            success: false,
            message: 'Blog not found',
            error: 'No blog found with the provided ID',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve blog',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
