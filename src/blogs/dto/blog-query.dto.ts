import { IsString, IsOptional, IsNotEmpty, MaxLength, IsBoolean } from 'class-validator';

export class BlogQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  sort_by?: 'created_at' | 'updated_at' | 'heading';

  @IsOptional()
  @IsString()
  @MaxLength(4)
  order?: 'ASC' | 'DESC';

  @IsOptional()
  @IsString()
  @MaxLength(3)
  page?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  limit?: string;
}
