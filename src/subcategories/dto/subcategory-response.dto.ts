import { ApiProperty } from "@nestjs/swagger";

export class SubcategoryDto {
  @ApiProperty({
    description: "Subcategory ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Subcategory name",
    example: "Running Shoes",
  })
  name: string;

  @ApiProperty({
    description: "Subcategory description",
    example: "Athletic running shoes",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "Parent category ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  cat_id: string;

  @ApiProperty({ description: "Is subcategory active", example: true })
  is_active: boolean;

  @ApiProperty({ nullable: true }) created_by: string | null;
  @ApiProperty({ nullable: true }) updated_by: string | null;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class SubcategoryResponseDto {
  @ApiProperty({ example: 200 }) statusCode: number;
  @ApiProperty({ example: true }) status: boolean;
  @ApiProperty({ example: "Subcategory retrieved successfully" }) message: string;
  @ApiProperty({ example: "Subcategory" }) heading: string;
  @ApiProperty({ type: SubcategoryDto }) data: SubcategoryDto;
}

export class SubcategoriesListResponseDto {
  @ApiProperty({ example: 200 }) statusCode: number;
  @ApiProperty({ example: true }) status: boolean;
  @ApiProperty({ example: "Subcategories retrieved successfully" }) message: string;
  @ApiProperty({ example: "Subcategory" }) heading: string;
  @ApiProperty({
    type: "object",
    properties: {
      subcategories: { type: "array", items: { $ref: "#/components/schemas/SubcategoryDto" } },
      pagination: { type: "object" },
    },
  })
  data: {
    subcategories: SubcategoryDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextPage: number | null;
      prevPage: number | null;
    };
  };
}
