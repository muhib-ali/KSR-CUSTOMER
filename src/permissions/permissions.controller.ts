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
import { PermissionsService } from "./permissions.service";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { DeletePermissionDto } from "./dto/delete-permission.dto";
import { PermissionFilterDto } from "./dto/permission-filter.dto";
import {
  PermissionResponseDto,
  PermissionsListResponseDto,
} from "./dto/permission-response.dto";

@ApiTags("Permissions")
@ApiBearerAuth("JWT-auth")
@Controller("permissions")
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Post("create")
  @ApiOperation({ summary: "Create new permission" })
  @ApiResponse({
    status: 201,
    description: "Permission created successfully",
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad Request - Permission with slug already exists in module or Module not found",
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: "Permission with this slug already exists in this module",
        heading: "Permission",
        data: null,
      },
    },
  })
  @ApiBody({ type: CreatePermissionDto })
  async create(
    @Body(ValidationPipe) createPermissionDto: CreatePermissionDto,
    @Request() req
  ) {
    const loggedInUserId = req.user?.id;
    return this.permissionsService.create(createPermissionDto, loggedInUserId);
  }

  @Put("update")
  @ApiOperation({ summary: "Update permission" })
  @ApiResponse({
    status: 200,
    description: "Permission updated successfully",
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Permission not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "Permission not found",
        heading: "Permission",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad Request - Permission with slug already exists in module or Module not found",
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: "Permission with this slug already exists in this module",
        heading: "Permission",
        data: null,
      },
    },
  })
  @ApiBody({ type: UpdatePermissionDto })
  async update(
    @Body(ValidationPipe) updatePermissionDto: UpdatePermissionDto,
    @Request() req
  ) {
    const loggedInUserId = req.user?.id;
    return this.permissionsService.update(updatePermissionDto, loggedInUserId);
  }

  @Get("getById/:id")
  @ApiOperation({ summary: "Get permission by ID" })
  @ApiResponse({
    status: 200,
    description: "Permission retrieved successfully",
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Permission not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "Permission not found",
        heading: "Permission",
        data: null,
      },
    },
  })
  @ApiParam({ name: "id", description: "Permission ID", type: "string" })
  async getById(@Param("id") id: string) {
    return this.permissionsService.getById(id);
  }

  @Get("getAll")
  @ApiOperation({
    summary: "Get all permissions with pagination and optional module filter",
  })
  @ApiResponse({
    status: 200,
    description: "Permissions retrieved successfully",
    type: PermissionsListResponseDto,
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page",
  })
  @ApiQuery({
    name: "moduleId",
    required: false,
    type: String,
    description: "Module ID to filter permissions",
    example: "8af18c09-a3c0-4aeb-b730-6d489bfb26d6",
  })
  async getAll(@Query(ValidationPipe) filterDto: PermissionFilterDto) {
    return this.permissionsService.getAll(filterDto);
  }

  @Delete("delete")
  @ApiOperation({ summary: "Delete permission" })
  @ApiResponse({
    status: 200,
    description: "Permission deleted successfully",
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: "Permission deleted successfully",
        heading: "Permission",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Permission not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "Permission not found",
        heading: "Permission",
        data: null,
      },
    },
  })
  @ApiBody({ type: DeletePermissionDto })
  async delete(@Body(ValidationPipe) deletePermissionDto: DeletePermissionDto) {
    return this.permissionsService.delete(deletePermissionDto);
  }
}
