import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { CmsService } from "./cms.service";
import { CmsQueryDto } from "./dto/cms-query.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("CMS")
@Controller("cms")
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

 

  @Get("getAll")
  @ApiOperation({ summary: "Get all CMS sections (paginated)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "sort_by", required: false })
  @ApiQuery({ name: "order", required: false })
  @ApiResponse({ status: 200, description: "Sections retrieved successfully" })
  async findAll(@Query() query: CmsQueryDto) {
    const { rows, total } = await this.cmsService.findAll(query);
    return {
      success: true,
      message: "CMS sections retrieved successfully",
      data: rows,
      pagination: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      },
    };
  }

  @Get("getById/:id")
  @ApiOperation({ summary: "Get CMS section by ID with subsections" })
  @ApiParam({ name: "id", description: "Section UUID" })
  @ApiResponse({ status: 200, description: "Section retrieved successfully" })
  @ApiResponse({ status: 404, description: "Section not found" })
  async findOne(@Param("id") id: string) {
    const data = await this.cmsService.findOne(id);
    return {
      success: true,
      message: "CMS section retrieved successfully",
      data,
    };
  }


}
