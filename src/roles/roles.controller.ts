import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { DeleteRoleDto } from "./dto/delete-role.dto";
import {
  UpdateRolePermissionsDto,
  RolePermissionsResponseDto,
} from "./dto/role-permissions.dto";
import { RoleResponseDto, RolesListResponseDto } from "./dto/role-response.dto";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Roles")
@ApiBearerAuth("JWT-auth")
@Controller("roles")
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post("create")
  @ApiOperation({ summary: "Create new role" })
  @ApiResponse({
    status: 201,
    description: "Role created successfully",
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Role with this title already exists",
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: "Role with this title already exists",
        heading: "Role",
        data: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBody({ type: CreateRoleDto })
  async create(@Body(ValidationPipe) createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Put("update")
  @ApiOperation({ summary: "Update existing role" })
  @ApiResponse({
    status: 200,
    description: "Role updated successfully",
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: "Role not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBody({ type: UpdateRoleDto })
  async update(@Body(ValidationPipe) updateRoleDto: UpdateRoleDto) {
    const { id, ...updateData } = updateRoleDto;
    return this.rolesService.update(
      id,
      updateData as Partial<Omit<UpdateRoleDto, "id">>
    );
  }

  @Get("getById/:id")
  @ApiOperation({ summary: "Get role by ID" })
  @ApiResponse({
    status: 200,
    description: "Role found",
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: "Role not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiParam({ name: "id", description: "Role UUID" })
  async getById(@Param("id") id: string) {
    return this.rolesService.getById(id);
  }

  @Get("getAll")
  @ApiOperation({ summary: "Get all roles with pagination" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10, max: 100)",
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: "Roles retrieved successfully",
    type: RolesListResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getAll(@Query(ValidationPipe) paginationDto: PaginationDto) {
    return this.rolesService.getAll(paginationDto);
  }

  @Delete("delete")
  @ApiOperation({ summary: "Delete role" })
  @ApiResponse({
    status: 200,
    description: "Role deleted successfully",
    schema: {
      example: {
        status: true,
        message: "Role deleted successfully",
        heading: "Role",
        data: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: "Role not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBody({ type: DeleteRoleDto })
  async delete(@Body(ValidationPipe) deleteRoleDto: DeleteRoleDto) {
    return this.rolesService.delete(deleteRoleDto.id);
  }

  @Get("getAllPermissionsByRoleId/:roleId")
  @ApiOperation({ summary: "Get all permissions by role ID" })
  @ApiResponse({
    status: 200,
    description: "Role permissions retrieved successfully",
    type: RolePermissionsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Role not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "Role not found",
        heading: "Role",
        data: null,
      },
    },
  })
  @ApiParam({ name: "roleId", description: "Role ID", type: "string" })
  async getAllPermissionsByRoleId(@Param("roleId") roleId: string) {
    return this.rolesService.getAllPermissionsByRoleId(roleId);
  }

  @Put("updatePermissionsAccessByRoleId")
  @ApiOperation({ summary: "Update permissions access by role ID" })
  @ApiResponse({
    status: 200,
    description: "Role permissions updated successfully",
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: "Role permissions updated successfully",
        heading: "Role",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Role not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "Role not found",
        heading: "Role",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - One or more permissions not found",
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: "One or more permissions not found",
        heading: "Role",
        data: null,
      },
    },
  })
  @ApiBody({ type: UpdateRolePermissionsDto })
  async updatePermissionsAccessByRoleId(
    @Body(ValidationPipe) updateDto: UpdateRolePermissionsDto,
    @Request() req
  ) {
    const loggedInUserId = req.user?.id;
    return this.rolesService.updatePermissionsAccessByRoleId(
      updateDto,
      loggedInUserId
    );
  }
}
