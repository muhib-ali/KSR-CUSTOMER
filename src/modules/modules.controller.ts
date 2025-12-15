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
import { ModulesService } from "./modules.service";
import { CreateModuleDto } from "./dto/create-module.dto";
import { UpdateModuleDto } from "./dto/update-module.dto";
import { DeleteModuleDto } from "./dto/delete-module.dto";
import {
  ModuleResponseDto,
  ModulesListResponseDto,
} from "./dto/module-response.dto";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Modules")
@ApiBearerAuth("JWT-auth")
@Controller("modules")
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  @Post("create")
  @ApiOperation({ summary: "Create new module" })
  @ApiResponse({
    status: 201,
    description: "Module created successfully",
    type: ModuleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Module with slug already exists",
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: "Module with this slug already exists",
        heading: "Module",
        data: null,
      },
    },
  })
  @ApiBody({ type: CreateModuleDto })
  async create(@Body(ValidationPipe) createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @Put("update")
  @ApiOperation({ summary: "Update module" })
  @ApiResponse({
    status: 200,
    description: "Module updated successfully",
    type: ModuleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Module not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "Module not found",
        heading: "Module",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Module with slug already exists",
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: "Module with this slug already exists",
        heading: "Module",
        data: null,
      },
    },
  })
  @ApiBody({ type: UpdateModuleDto })
  async update(@Body(ValidationPipe) updateModuleDto: UpdateModuleDto) {
    return this.modulesService.update(updateModuleDto);
  }

  @Get("getById/:id")
  @ApiOperation({ summary: "Get module by ID" })
  @ApiResponse({
    status: 200,
    description: "Module retrieved successfully",
    type: ModuleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Module not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "Module not found",
        heading: "Module",
        data: null,
      },
    },
  })
  @ApiParam({ name: "id", description: "Module ID", type: "string" })
  async getById(@Param("id") id: string) {
    return this.modulesService.getById(id);
  }

  @Get("getAll")
  @ApiOperation({ summary: "Get all modules with pagination" })
  @ApiResponse({
    status: 200,
    description: "Modules retrieved successfully",
    type: ModulesListResponseDto,
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
  async getAll(@Query(ValidationPipe) paginationDto: PaginationDto) {
    return this.modulesService.getAll(paginationDto);
  }

  @Delete("delete")
  @ApiOperation({ summary: "Delete module" })
  @ApiResponse({
    status: 200,
    description: "Module deleted successfully",
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: "Module deleted successfully",
        heading: "Module",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Module not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "Module not found",
        heading: "Module",
        data: null,
      },
    },
  })
  @ApiBody({ type: DeleteModuleDto })
  async delete(@Body(ValidationPipe) deleteModuleDto: DeleteModuleDto) {
    return this.modulesService.delete(deleteModuleDto);
  }
}
