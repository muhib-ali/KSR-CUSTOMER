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
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { UserResponseDto, UsersListResponseDto } from "./dto/user-response.dto";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post("create")
  @ApiOperation({ summary: "Create new user" })
  @ApiResponse({
    status: 201,
    description: "User created successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad Request - User with email already exists or Role not found",
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: "User with this email already exists",
        heading: "User",
        data: null,
      },
    },
  })
  @ApiBody({ type: CreateUserDto })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @Request() req
  ) {
    const loggedInUserId = req.user?.id;
    return this.usersService.create(createUserDto, loggedInUserId);
  }

  @Put("update")
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({
    status: 200,
    description: "User updated successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "User not found",
        heading: "User",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad Request - User with email already exists or Role not found",
    schema: {
      example: {
        statusCode: 400,
        status: false,
        message: "User with this email already exists",
        heading: "User",
        data: null,
      },
    },
  })
  @ApiBody({ type: UpdateUserDto })
  async update(
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Request() req
  ) {
    const loggedInUserId = req.user?.id;
    return this.usersService.update(updateUserDto, loggedInUserId);
  }

  @Get("getById/:id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({
    status: 200,
    description: "User retrieved successfully",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "User not found",
        heading: "User",
        data: null,
      },
    },
  })
  @ApiParam({ name: "id", description: "User ID", type: "string" })
  async getById(@Param("id") id: string) {
    return this.usersService.getById(id);
  }

  @Get("getAll")
  @ApiOperation({ summary: "Get all users with pagination" })
  @ApiResponse({
    status: 200,
    description: "Users retrieved successfully",
    type: UsersListResponseDto,
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
    return this.usersService.getAll(paginationDto);
  }

  @Delete("delete")
  @ApiOperation({ summary: "Delete user" })
  @ApiResponse({
    status: 200,
    description: "User deleted successfully",
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: "User deleted successfully",
        heading: "User",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
    schema: {
      example: {
        statusCode: 404,
        status: false,
        message: "User not found",
        heading: "User",
        data: null,
      },
    },
  })
  @ApiBody({ type: DeleteUserDto })
  async delete(@Body(ValidationPipe) deleteUserDto: DeleteUserDto) {
    return this.usersService.delete(deleteUserDto);
  }
}
