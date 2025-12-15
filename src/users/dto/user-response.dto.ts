import { ApiProperty } from "@nestjs/swagger";

export class RoleDto {
  @ApiProperty({
    description: "Role ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Role title",
    example: "Platform Admin",
  })
  title: string;

  @ApiProperty({
    description: "Role slug",
    example: "platformAdmin",
  })
  slug: string;
}

export class UserDto {
  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "User name",
    example: "John Doe",
  })
  name: string;

  @ApiProperty({
    description: "User email",
    example: "john.doe@example.com",
  })
  email: string;

  @ApiProperty({
    description: "Role ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  role_id: string;

  @ApiProperty({
    description: "User role information",
    type: RoleDto,
  })
  role: RoleDto;

  @ApiProperty({
    description: "Is user active",
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

export class UserResponseDto {
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
    example: "User retrieved successfully",
  })
  message: string;

  @ApiProperty({
    description: "User heading",
    example: "User",
  })
  heading: string;

  @ApiProperty({
    description: "User data",
    type: UserDto,
  })
  data: UserDto;
}

export class UsersListResponseDto {
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
    example: "Users retrieved successfully",
  })
  message: string;

  @ApiProperty({
    description: "User heading",
    example: "User",
  })
  heading: string;

  @ApiProperty({
    description: "Users data with pagination",
    type: "object",
    properties: {
      users: {
        type: "array",
        items: { $ref: "#/components/schemas/UserDto" },
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
    users: UserDto[];
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
