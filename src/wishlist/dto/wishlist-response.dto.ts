import { Product } from '../../entities/product.entity';

export class WishlistResponseDto {
  id: string;
  customer_id: string;
  product_id: string;
  product: Product;
  created_at: Date;
}

export class WishlistItemDto {
  id: string;
  product_id: string;
  product: Product;
  added_at: Date;
}
