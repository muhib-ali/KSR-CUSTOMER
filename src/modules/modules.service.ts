import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Module } from "../entities/module.entity";
import { CreateModuleDto } from "./dto/create-module.dto";
import { UpdateModuleDto } from "./dto/update-module.dto";
import { DeleteModuleDto } from "./dto/delete-module.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { ResponseHelper } from "../common/helpers/response.helper";
import {
  ApiResponse,
  PaginatedApiResponse,
} from "../common/interfaces/api-response.interface";

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>
  ) {}

  async create(createModuleDto: CreateModuleDto): Promise<ApiResponse<Module>> {
    const { title, slug, description } = createModuleDto;

    // Check if module with same slug already exists
    const existingModule = await this.moduleRepository.findOne({
      where: { slug },
    });

    if (existingModule) {
      throw new BadRequestException("Module with this slug already exists");
    }

    const module = this.moduleRepository.create({
      title,
      slug,
      description,
    });

    const savedModule = await this.moduleRepository.save(module);

    return ResponseHelper.success(
      savedModule,
      "Module created successfully",
      "Module",
      201
    );
  }

  async update(updateModuleDto: UpdateModuleDto): Promise<ApiResponse<Module>> {
    const { id, title, slug, description } = updateModuleDto;

    const module = await this.moduleRepository.findOne({ where: { id } });
    if (!module) {
      throw new NotFoundException("Module not found");
    }

    // Check if another module with same slug exists (excluding current module)
    const existingModule = await this.moduleRepository.findOne({
      where: { slug },
    });

    if (existingModule && existingModule.id !== id) {
      throw new BadRequestException("Module with this slug already exists");
    }

    // Update module data
    const updateData: Partial<Omit<UpdateModuleDto, "id">> = {
      title,
      slug,
      description,
    };

    await this.moduleRepository.update(id, updateData);

    const updatedModule = await this.moduleRepository.findOne({
      where: { id },
    });

    return ResponseHelper.success(
      updatedModule!,
      "Module updated successfully",
      "Module",
      200
    );
  }

  async getById(id: string): Promise<ApiResponse<Module>> {
    const module = await this.moduleRepository.findOne({ where: { id } });

    if (!module) {
      throw new NotFoundException("Module not found");
    }

    return ResponseHelper.success(
      module,
      "Module retrieved successfully",
      "Module",
      200
    );
  }

  async getAll(
    paginationDto: PaginationDto
  ): Promise<PaginatedApiResponse<Module>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [modules, total] = await this.moduleRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: "DESC" },
    });

    return ResponseHelper.paginated(
      modules,
      page,
      limit,
      total,
      "modules",
      "Modules retrieved successfully",
      "Module"
    );
  }

  async delete(deleteModuleDto: DeleteModuleDto): Promise<ApiResponse<null>> {
    const { id } = deleteModuleDto;

    const module = await this.moduleRepository.findOne({ where: { id } });
    if (!module) {
      throw new NotFoundException("Module not found");
    }

    await this.moduleRepository.remove(module);

    return ResponseHelper.success(
      null,
      "Module deleted successfully",
      "Module",
      200
    );
  }
}
