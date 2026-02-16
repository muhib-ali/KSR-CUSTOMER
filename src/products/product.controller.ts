import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  ValidationPipe,
  NotFoundException
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
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
  @ApiQuery({ name: 'subcategory', required: false, type: String })
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

  @Get('best')
  @ApiOperation({ summary: 'Get best products (highest purchases + highest ratings combined)' })
  @ApiResponse({
    status: 200,
    description: 'Best products retrieved successfully',
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
          example: 'Best products retrieved successfully'
        },
        data: {
          type: 'array',
          description: 'Array of best product objects (includes computed fields like soldQty, avgRating)',
          items: {
            $ref: getSchemaPath(Product),
            description: 'Best product object with full details'
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return (default 2)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Lookback days for purchase counting (default 30)' })
  @ApiQuery({ name: 'minReviews', required: false, type: Number, description: 'Minimum approved reviews required (default 3, fallback applies if too strict)' })
  async getBestProducts(
    @Query('limit') limit?: string,
    @Query('days') days?: string,
    @Query('minReviews') minReviews?: string,
  ) {
    return this.productService.getBestProducts({
      limit: limit ? Number(limit) : undefined,
      days: days ? Number(days) : undefined,
      minReviews: minReviews ? Number(minReviews) : undefined,
    });
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

  @Get('bulk-pricing/:productId')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get bulk pricing for a product' })
  @ApiResponse({
    status: 200,
    description: 'Bulk pricing retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Bulk pricing retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
              quantity: { type: 'integer', example: 10 },
              price_per_product: { type: 'number', example: 90.00 },
              product_id: { type: 'string', example: '456e7890-e89b-12d3-a456-426614174111' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  async getProductBulkPricing(@Param('productId') productId: string) {
    return this.productService.getProductBulkPricing(productId);
  }

  @Get('sku/:sku/bulk-pricing')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get product with bulk pricing by SKU' })
  @ApiResponse({
    status: 200,
    description: 'Product with bulk pricing retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Product with bulk pricing retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            product: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                title: { type: 'string', example: 'Garrett Turbo' },
                sku: { type: 'string', example: 'TRB-GTX3582R' },
                price: { type: 'number', example: 100.00 },
                stock_quantity: { type: 'integer', example: 50 }
              }
            },
            bulkPricing: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '789e0123-e89b-12d3-a456-426614174222' },
                  quantity: { type: 'integer', example: 10 },
                  price_per_product: { type: 'number', example: 90.00 }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiParam({ name: 'sku', description: 'Product SKU' })
  async getProductWithBulkPricingBySku(@Param('sku') sku: string) {
    return this.productService.getProductWithBulkPricingBySku(sku);
  }
}
