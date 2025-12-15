import { ApiProperty } from "@nestjs/swagger";
import { ModuleWithPermissionsDto } from "./modules-permissions.dto";

export class UserDto {
  @ApiProperty({
    description: "User UUID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  @ApiProperty({
    description: "User name",
    example: "Arsalan",
  })
  name: string;

  @ApiProperty({
    description: "User email",
    example: "arsalan@mentorhealth.com",
  })
  email: string;

  @ApiProperty({
    description: "User role",
    example: { id: "role-uuid", title: "Platform Admin" },
  })
  role: {
    id: string;
    title: string;
  };
}

export class LoginDataDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  token: string;

  @ApiProperty({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  refresh_token: string;

  @ApiProperty({
    description: "Token expiry date",
    example: "2024-01-01T00:15:00.000Z",
  })
  expires_at: string;

  @ApiProperty({
    type: [ModuleWithPermissionsDto],
    description: "User's modules with permissions based on role",
  })
  modulesWithPermisssions: ModuleWithPermissionsDto[];
}

export class LoginResponseDto {
  @ApiProperty({
    description: "HTTP status code",
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: "Success status",
    example: true,
  })
  status: boolean;

  @ApiProperty({
    description: "Response message",
    example: "Login successful",
  })
  message: string;

  @ApiProperty({
    description: "Module heading",
    example: "Authentication",
  })
  heading: string;

  @ApiProperty({ type: LoginDataDto })
  data: LoginDataDto;
}
