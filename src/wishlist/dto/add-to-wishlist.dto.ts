import { IsUUID } from 'class-validator';

export class AddToWishlistDto {
  @IsUUID()
  product_id: string;
}
