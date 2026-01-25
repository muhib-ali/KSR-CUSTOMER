import { IsUUID, IsNumber, Min, Max, IsOptional, IsString, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator';
import { Type } from 'class-transformer';

// Custom validator to accept UUID-like strings
@ValidatorConstraint({ name: 'isUUIDString', async: false })
export class IsUUIDStringConstraint implements ValidatorConstraintInterface {
  validate(text: string) {
    // Basic UUID pattern check (allow 32-36 chars with optional dashes)
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const shortPattern = /^[0-9a-fA-F]{32}$/;
    return uuidPattern.test(text) || shortPattern.test(text);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid UUID format';
  }
}

export function IsUUIDString() {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {},
      constraints: [IsUUIDStringConstraint],
      validator: IsUUIDStringConstraint,
    });
  };
}

export class AddToCartDto {
  @IsUUIDString()
  product_id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(999)
  quantity: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  requested_price_per_unit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offered_price_per_unit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bulk_min_quantity?: number;
}

export class UpdateCartDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999)
  quantity: number;
}
