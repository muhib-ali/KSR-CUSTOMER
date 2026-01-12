import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class EditProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Fullname must be at least 2 characters long' })
  @MaxLength(100, { message: 'Fullname cannot exceed 100 characters' })
  fullname?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Phone number must be at least 10 characters long' })
  @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
  phone?: string;
}
