import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { Subcategory } from "../entities/subcategory.entity";
import { Category } from "../entities/category.entity";
import { CreateSubcategoryDto } from "./dto/create-subcategory.dto";
import { UpdateSubcategoryDto } from "./dto/update-subcategory.dto";
import { DeleteSubcategoryDto } from "./dto/delete-subcategory.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { ResponseHelper } from "../common/helpers/response.helper";
import {
  ApiResponse,
  PaginatedApiResponse,
} from "../common/interfaces/api-response.interface";

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectRepository(Subcategory)
    private subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ) {}

  async create(
    createSubcategoryDto: CreateSubcategoryDto
  ): Promise<ApiResponse<Subcategory>> {
    const { name, description, cat_id, isActive } = createSubcategoryDto;

    const category = await this.categoryRepository.findOne({
      where: { id: cat_id },
    });
    if (!category) {
      throw new BadRequestException("Category not found");
    }

    const existingByName = await this.subcategoryRepository.findOne({
      where: { name, cat_id },
    });
    if (existingByName) {
      throw new BadRequestException(
        "A subcategory with this name already exists under this category"
      );
    }

    const subcategory = this.subcategoryRepository.create({
      name,
      description,
      cat_id,
      is_active: isActive !== undefined ? isActive : true,
    });

    const saved = await this.subcategoryRepository.save(subcategory);
    return ResponseHelper.success(
      saved,
      "Subcategory created successfully",
      "Subcategory",
      201
    );
  }

  async update(
    updateSubcategoryDto: UpdateSubcategoryDto
  ): Promise<ApiResponse<Subcategory>> {
    const { id, name, description, cat_id, isActive } = updateSubcategoryDto;

    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
    });
    if (!subcategory) {
      throw new NotFoundException("Subcategory not found");
    }

    const category = await this.categoryRepository.findOne({
      where: { id: cat_id },
    });
    if (!category) {
      throw new BadRequestException("Category not found");
    }

    const existingByName = await this.subcategoryRepository.findOne({
      where: { name, cat_id },
    });
    if (existingByName && existingByName.id !== id) {
      throw new BadRequestException(
        "A subcategory with this name already exists under this category"
      );
    }

    const updateData: any = { name, description, cat_id };
    if (isActive !== undefined) updateData.is_active = isActive;
    await this.subcategoryRepository.update(id, updateData);

    const updated = await this.subcategoryRepository.findOne({
      where: { id },
    });
    return ResponseHelper.success(
      updated!,
      "Subcategory updated successfully",
      "Subcategory",
      200
    );
  }

  async getById(id: string): Promise<ApiResponse<Subcategory>> {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ["category"],
    });
    if (!subcategory) {
      throw new NotFoundException("Subcategory not found");
    }
    return ResponseHelper.success(
      subcategory,
      "Subcategory retrieved successfully",
      "Subcategory",
      200
    );
  }

  async getAll(
    paginationDto: PaginationDto,
    search?: string,
    cat_id?: string
  ): Promise<PaginatedApiResponse<Subcategory>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.subcategoryRepository
      .createQueryBuilder("subcategory")
      .leftJoinAndSelect("subcategory.category", "category")
      .orderBy("subcategory.created_at", "DESC")
      .skip(skip)
      .take(limit);

    if (cat_id) {
      qb.andWhere("subcategory.cat_id = :cat_id", { cat_id });
    }

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where("subcategory.name ILIKE :search", {
              search: `%${trimmedSearch}%`,
            })
            .orWhere("subcategory.description ILIKE :search", {
              search: `%${trimmedSearch}%`,
            });
        })
      );
    }

    const [subcategories, total] = await qb.getManyAndCount();

    return ResponseHelper.paginated(
      subcategories,
      page,
      limit,
      total,
      "subcategories",
      "Subcategories retrieved successfully",
      "Subcategory"
    );
  }

  async delete(
    deleteSubcategoryDto: DeleteSubcategoryDto
  ): Promise<ApiResponse<null>> {
    const { id } = deleteSubcategoryDto;
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
    });
    if (!subcategory) {
      throw new NotFoundException("Subcategory not found");
    }
    await this.subcategoryRepository.remove(subcategory);
    return ResponseHelper.success(
      null,
      "Subcategory deleted successfully",
      "Subcategory",
      200
    );
  }
}
