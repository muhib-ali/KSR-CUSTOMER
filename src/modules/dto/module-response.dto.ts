import { ApiProperty } from "@nestjs/swagger";

export class ModuleDto {
  @ApiProperty({
    description: "Module ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Module title",
    example: "User Management",
  })
  title: string;

  @ApiProperty({
    description: "Module slug",
    example: "userManagement",
  })
  slug: string;

  @ApiProperty({
    description: "Module description",
    example: "Manage user accounts and profiles",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "Is module active",
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: "Created by user ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    nullable: true,
  })
  created_by: string | null;

  @ApiProperty({
    description: "Updated by user ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    nullable: true,
  })
  updated_by: string | null;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  created_at: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  updated_at: Date;
}

export class ModuleResponseDto {
  @ApiProperty({
    description: "Status code",
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: "Operation status",
    example: true,
  })
  status: boolean;

  @ApiProperty({
    description: "Response message",
    example: "Module retrieved successfully",
  })
  message: string;

  @ApiProperty({
    description: "Module heading",
    example: "Module",
  })
  heading: string;

  @ApiProperty({
    description: "Module data",
    type: ModuleDto,
  })
  data: ModuleDto;
}

export class ModulesListResponseDto {
  @ApiProperty({
    description: "Status code",
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: "Operation status",
    example: true,
  })
  status: boolean;

  @ApiProperty({
    description: "Response message",
    example: "Modules retrieved successfully",
  })
  message: string;

  @ApiProperty({
    description: "Module heading",
    example: "Module",
  })
  heading: string;

  @ApiProperty({
    description: "Modules data with pagination",
    type: "object",
    properties: {
      modules: {
        type: "array",
        items: { $ref: "#/components/schemas/ModuleDto" },
      },
      pagination: {
        type: "object",
        properties: {
          page: { type: "number", example: 1 },
          limit: { type: "number", example: 10 },
          total: { type: "number", example: 50 },
          totalPages: { type: "number", example: 5 },
          hasNext: { type: "boolean", example: true },
          hasPrev: { type: "boolean", example: false },
          nextPage: { type: "number", example: 2, nullable: true },
          prevPage: { type: "number", example: null, nullable: true },
        },
      },
    },
  })
  data: {
    modules: ModuleDto[];
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
