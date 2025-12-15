import { ApiProperty } from "@nestjs/swagger";

export class PermissionDetailDto {
  @ApiProperty({
    description: "Permission name from permissions table",
    example: "Add Role",
  })
  permission_name: string;

  @ApiProperty({
    description: "Show in menu - true only if permission_slug is 'getAll'",
    example: false,
  })
  is_Show_in_menu: boolean;

  @ApiProperty({
    description: "Permission slug from role_permissions table",
    example: "create",
  })
  permission_slug: string;

  @ApiProperty({
    description: "Dynamic route created from module_slug/permission_slug",
    example: "roles/create",
  })
  route: string;

  @ApiProperty({
    description: "Is allowed from role_permissions table",
    example: true,
  })
  is_allowed: boolean;
}

export class ModuleWithPermissionsDto {
  @ApiProperty({
    description: "Module name from modules table",
    example: "Roles",
  })
  module_name: string;

  @ApiProperty({
    description: "Module slug from role_permissions table",
    example: "roles",
  })
  module_slug: string;

  @ApiProperty({
    type: [PermissionDetailDto],
    description: "Array of permissions for this module",
  })
  permissions: PermissionDetailDto[];
}
