import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  ValidationPipe,
  NotFoundException 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { GetProductsDto } from './dto/get-products.dto';
import { Product } from '../entities/product.entity';

import { ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

@ApiTags('Products')
@ApiExtraModels(Product)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'Products retrieved successfully' 
        },
        data: {
          type: 'object',
          description: 'Response data containing products and pagination info',
          properties: {
            products: {
              type: 'array',
              description: 'Array of product objects',
              items: { 
                $ref: getSchemaPath(Product),
                description: 'Product object with full details'
              }
            },
            pagination: {
              type: 'object',
              description: 'Pagination information',
              properties: {
                page: { 
                  type: 'number', 
                  description: 'Current page number',
                  example: 1 
                },
                limit: { 
                  type: 'number', 
                  description: 'Number of items per page',
                  example: 20 
                },
                total: { 
                  type: 'number', 
                  description: 'Total number of products',
                  example: 150 
                },
                totalPages: { 
                  type: 'number', 
                  description: 'Total number of pages',
                  example: 8 
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'brand', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAllProducts(@Query(ValidationPipe) query: GetProductsDto) {
    return this.productService.getAllProducts(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiResponse({
    status: 200,
    description: 'Featured products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'Featured products retrieved successfully' 
        },
        data: {
          type: 'array',
          description: 'Array of featured product objects',
          items: { 
            $ref: getSchemaPath(Product),
            description: 'Featured product object with full details'
          }
        }
      }
    }
  })
  async getFeaturedProducts() {
    return this.productService.getFeaturedProducts();
  }

  @Get('new-arrivals')
  @ApiOperation({ summary: 'Get new arrivals' })
  @ApiResponse({
    status: 200,
    description: 'New arrivals retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'New arrivals retrieved successfully' 
        },
        data: {
          type: 'array',
          description: 'Array of new arrival product objects',
          items: { 
            $ref: getSchemaPath(Product),
            description: 'New arrival product object with full details'
          }
        }
      }
    }
  })
  async getNewArrivals() {
    return this.productService.getNewArrivals();
  }

  @Get('best-sellers')
  @ApiOperation({ summary: 'Get best sellers' })
  @ApiResponse({
    status: 200,
    description: 'Best sellers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'Best sellers retrieved successfully' 
        },
        data: {
          type: 'array',
          description: 'Array of best seller product objects',
          items: { 
            $ref: getSchemaPath(Product),
            description: 'Best seller product object with full details'
          }
        }
      }
    }
  })
  async getBestSellers() {
    return this.productService.getBestSellers();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({
    status: 200,
    description: 'Products search results',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'Products search results' 
        },
        data: {
          type: 'object',
          description: 'Search results containing products and pagination info',
          properties: {
            products: {
              type: 'array',
              description: 'Array of products matching search criteria',
              items: { 
                $ref: getSchemaPath(Product),
                description: 'Product object matching search query'
              }
            },
            pagination: {
              type: 'object',
              description: 'Pagination information for search results',
              properties: {
                page: { 
                  type: 'number', 
                  description: 'Current page number',
                  example: 1 
                },
                limit: { 
                  type: 'number', 
                  description: 'Number of items per page',
                  example: 20 
                },
                total: { 
                  type: 'number', 
                  description: 'Total number of matching products',
                  example: 5 
                },
                totalPages: { 
                  type: 'number', 
                  description: 'Total number of pages',
                  example: 1 
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'q', required: true, type: String })
  async searchProducts(@Query('q') searchQuery: string) {
    return this.productService.getAllProducts({ search: searchQuery });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'Product retrieved successfully' 
        },
        data: { 
          $ref: getSchemaPath(Product),
          description: 'Product object with full details including category, brand, images, variants'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'Product retrieved successfully' 
        },
        data: { 
          $ref: getSchemaPath(Product),
          description: 'Product object with full details including category, brand, images, variants'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({
    status: 200,
    description: 'Products by category retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'Products by category retrieved successfully' 
        },
        data: {
          type: 'object',
          description: 'Category products with pagination info',
          properties: {
            products: {
              type: 'array',
              description: 'Array of products in the specified category',
              items: { 
                $ref: getSchemaPath(Product),
                description: 'Product object belonging to the category'
              }
            },
            pagination: {
              type: 'object',
              description: 'Pagination information for category products',
              properties: {
                page: { 
                  type: 'number', 
                  description: 'Current page number',
                  example: 1 
                },
                limit: { 
                  type: 'number', 
                  description: 'Number of items per page',
                  example: 20 
                },
                total: { 
                  type: 'number', 
                  description: 'Total number of products in category',
                  example: 25 
                },
                totalPages: { 
                  type: 'number', 
                  description: 'Total number of pages',
                  example: 2 
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  async getProductsByCategory(@Param('categoryId') categoryId: string) {
    return this.productService.getProductsByCategory(categoryId);
  }

  @Get('brand/:brandId')
  @ApiOperation({ summary: 'Get products by brand' })
  @ApiResponse({
    status: 200,
    description: 'Products by brand retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'Products by brand retrieved successfully' 
        },
        data: {
          type: 'object',
          description: 'Brand products with pagination info',
          properties: {
            products: {
              type: 'array',
              description: 'Array of products from the specified brand',
              items: { 
                $ref: getSchemaPath(Product),
                description: 'Product object from the brand'
              }
            },
            pagination: {
              type: 'object',
              description: 'Pagination information for brand products',
              properties: {
                page: { 
                  type: 'number', 
                  description: 'Current page number',
                  example: 1 
                },
                limit: { 
                  type: 'number', 
                  description: 'Number of items per page',
                  example: 20 
                },
                total: { 
                  type: 'number', 
                  description: 'Total number of products from brand',
                  example: 30 
                },
                totalPages: { 
                  type: 'number', 
                  description: 'Total number of pages',
                  example: 2 
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
  async getProductsByBrand(@Param('brandId') brandId: string) {
    return this.productService.getProductsByBrand(brandId);
  }

  @Get('related/:id')
  @ApiOperation({ summary: 'Get related products' })
  @ApiResponse({
    status: 200,
    description: 'Related products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'boolean', 
          description: 'Request success status',
          example: true 
        },
        message: { 
          type: 'string', 
          description: 'Response message',
          example: 'Related products retrieved successfully' 
        },
        data: {
          type: 'array',
          description: 'Array of related product objects based on category, brand, or attributes',
          items: { 
            $ref: getSchemaPath(Product),
            description: 'Related product object with full details'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async getRelatedProducts(@Param('id') id: string) {
    return this.productService.getRelatedProducts(id);
  }
}
