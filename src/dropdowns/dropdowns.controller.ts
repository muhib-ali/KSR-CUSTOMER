import { Controller, Get } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { DropdownsService } from "./dropdowns.service";
import {
  RolesDropdownResponseDto,
  ModulesDropdownResponseDto,
} from "./dto/dropdown-response.dto";

@ApiTags("Dropdowns")
@ApiBearerAuth("JWT-auth")
@Controller("dropdowns")
export class DropdownsController {
  constructor(private dropdownsService: DropdownsService) {}

  @Get("getAllRoles")
  @ApiOperation({ summary: "Get all active roles for dropdown" })
  @ApiResponse({
    status: 200,
    description: "Roles dropdown data retrieved successfully",
    type: RolesDropdownResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getAllRoles() {
    return this.dropdownsService.getAllRoles();
  }

  @Get("getAllModules")
  @ApiOperation({ summary: "Get all active modules for dropdown" })
  @ApiResponse({
    status: 200,
    description: "Modules dropdown data retrieved successfully",
    type: ModulesDropdownResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getAllModules() {
    return this.dropdownsService.getAllModules();
  }
}
