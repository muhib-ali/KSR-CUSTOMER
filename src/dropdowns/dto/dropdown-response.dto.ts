import { ApiProperty } from "@nestjs/swagger";

export class DropdownItemDto {
  @ApiProperty({
    description: "Display label for dropdown",
    example: "Platform Admin",
  })
  label: string;

  @ApiProperty({
    description: "Value for dropdown item",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  value: string;
}

export class RolesDropdownDataDto {
  @ApiProperty({
    type: [DropdownItemDto],
    description: "Array of roles for dropdown",
  })
  rolesDropdown: DropdownItemDto[];
}

export class ModulesDropdownDataDto {
  @ApiProperty({
    type: [DropdownItemDto],
    description: "Array of modules for dropdown",
  })
  modulesDropdown: DropdownItemDto[];
}

export class RolesDropdownResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: "Roles dropdown data retrieved successfully" })
  message: string;

  @ApiProperty({ example: "Dropdowns" })
  heading: string;

  @ApiProperty({ type: RolesDropdownDataDto })
  data: RolesDropdownDataDto;
}

export class ModulesDropdownResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: "Modules dropdown data retrieved successfully" })
  message: string;

  @ApiProperty({ example: "Dropdowns" })
  heading: string;

  @ApiProperty({ type: ModulesDropdownDataDto })
  data: ModulesDropdownDataDto;
}
