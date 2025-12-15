import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ModuleDto {
  @ApiProperty({
    description: "Module ID",
    example: "8af18c09-a3c0-4aeb-b730-6d489bfb26d6",
  })
  id: string;

  @ApiProperty({
    description: "Module title",
    example: "Claim Management",
  })
  title: string;

  @ApiProperty({
    description: "Module slug",
    example: "claimManagement",
  })
  slug: string;

  @ApiProperty({
    description: "Module description",
    example: "Manage claims and claims processes",
    nullable: true,
  })
  description: string | null;
}

export class PermissionDto {
  @ApiProperty({
    description: "Permission ID",
    example: "9eca588e-e8f9-4346-abea-f57e84d85069",
  })
  id: string;

  @ApiProperty({
    description: "Module ID",
    example: "8af18c09-a3c0-4aeb-b730-6d489bfb26d6",
  })
  module_id: string;

  @ApiProperty({
    description: "Permission title",
    example: "claim Management create",
  })
  title: string;

  @ApiProperty({
    description: "Permission slug",
    example: "create",
  })
  slug: string;

  @ApiProperty({
    description: "Permission description",
    example: "Create claim",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "Module information",
    type: ModuleDto,
  })
  module: ModuleDto;

  @ApiProperty({
    description: "Is permission active",
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

export class PermissionResponseDto {
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
    example: "Permission retrieved successfully",
  })
  message: string;

  @ApiProperty({
    description: "Permission heading",
    example: "Permission",
  })
  heading: string;

  @ApiProperty({
    description: "Permission data",
    type: PermissionDto,
  })
  data: PermissionDto;
}

export class PermissionsListResponseDto {
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
    example: "Permissions retrieved successfully",
  })
  message: string;

  @ApiProperty({
    description: "Permission heading",
    example: "Permission",
  })
  heading: string;

  @ApiProperty({
    description: "Permissions data with pagination",
    type: "object",
    properties: {
      permissions: {
        type: "array",
        items: { $ref: "#/components/schemas/PermissionDto" },
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
    permissions: PermissionDto[];
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
