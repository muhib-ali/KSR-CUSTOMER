import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { RolePermission } from "../entities/role-permission.entity";
import { Permission } from "../entities/permission.entity";
import { Module } from "../entities/module.entity";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateRolePermissionsDto } from "./dto/role-permissions.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { ResponseHelper } from "../common/helpers/response.helper";
import {
  ApiResponse,
  PaginatedApiResponse,
} from "../common/interfaces/api-response.interface";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>
  ) {}

  // Helper function to convert title to camelCase slug
  private generateSlug(title: string): string {
    return title
      .trim()
      .replace(/[^\w\s]/gi, "") // Remove special characters
      .split(" ")
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
  }

  async create(createRoleDto: CreateRoleDto): Promise<ApiResponse<Role>> {
    const { title } = createRoleDto;
    const slug = this.generateSlug(title);

    // Check if slug already exists
    const existingRole = await this.roleRepository.findOne({
      where: { slug },
    });

    if (existingRole) {
      throw new BadRequestException("Role with this title already exists");
    }

    const role = this.roleRepository.create({
      title,
      slug,
      is_active: true,
    });

    const savedRole = await this.roleRepository.save(role);

    return ResponseHelper.success(
      savedRole,
      "Role created successfully",
      "Role",
      201
    );
  }

  async update(
    id: string,
    updateData: Partial<Omit<UpdateRoleDto, "id">>
  ): Promise<ApiResponse<Role>> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    // If title is being updated, regenerate slug
    if (updateData.title) {
      const newSlug = this.generateSlug(updateData.title);

      // Check if new slug conflicts with existing role (excluding current role)
      const existingRole = await this.roleRepository.findOne({
        where: { slug: newSlug },
      });

      if (existingRole && existingRole.id !== id) {
        throw new BadRequestException("Role with this title already exists");
      }

      role.title = updateData.title;
      role.slug = newSlug;
    }

    if (updateData.is_active !== undefined) {
      role.is_active = updateData.is_active;
    }

    const updatedRole = await this.roleRepository.save(role);

    return ResponseHelper.success(
      updatedRole,
      "Role updated successfully",
      "Role"
    );
  }

  async getById(id: string): Promise<ApiResponse<Role>> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    return ResponseHelper.success(role, "Role retrieved successfully", "Role");
  }

  async getAll(
    paginationDto: PaginationDto
  ): Promise<PaginatedApiResponse<Role>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [roles, total] = await this.roleRepository.findAndCount({
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return ResponseHelper.paginated(
      roles,
      page,
      limit,
      total,
      "roles",
      "Roles retrieved successfully",
      "Role"
    );
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    await this.roleRepository.remove(role);

    return ResponseHelper.success(
      null,
      "Role deleted successfully",
      "Role",
      200
    );
  }

  async getAllPermissionsByRoleId(roleId: string): Promise<ApiResponse<any>> {
    // First, check if role exists
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException("Role not found");
    }

    // Get ALL permissions with their modules
    const allPermissions = await this.permissionRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.module", "m")
      .orderBy("m.title", "ASC")
      .addOrderBy("p.title", "ASC")
      .getMany();

    // Get role_permissions for this specific role
    const rolePermissions = await this.rolePermissionRepository
      .createQueryBuilder("rp")
      .where("rp.role_id = :roleId", { roleId })
      .getMany();

    // Create a map of role permissions for quick lookup
    const rolePermissionMap = new Map();
    rolePermissions.forEach((rp) => {
      rolePermissionMap.set(rp.permission_id, rp);
    });

    // Group all permissions by module
    const moduleMap = new Map();

    allPermissions.forEach((permission) => {
      const moduleSlug = permission.module.slug;

      if (!moduleMap.has(moduleSlug)) {
        moduleMap.set(moduleSlug, {
          module_slug: moduleSlug,
          permissions: [],
        });
      }

      // Check if this permission exists in role_permissions
      const rolePermission = rolePermissionMap.get(permission.id);

      const permissionDetail = {
        id: permission.id,
        permission_slug: permission.slug,
        is_allowed: rolePermission ? rolePermission.is_allowed : false,
      };

      moduleMap.get(moduleSlug).permissions.push(permissionDetail);
    });

    const modulesWithPermisssions = Array.from(moduleMap.values());

    return ResponseHelper.success(
      { modulesWithPermisssions },
      "Role permissions retrieved successfully",
      "Role",
      200
    );
  }

  async updatePermissionsAccessByRoleId(
    updateDto: UpdateRolePermissionsDto,
    loggedInUserId: string
  ): Promise<ApiResponse<null>> {
    const { roleId, modulesWithPermissions } = updateDto;

    // Check if role exists
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException("Role not found");
    }

    // Validate all permission IDs exist
    const allPermissionIds = modulesWithPermissions.flatMap((module) =>
      module.permissions.map((p) => p.id)
    );

    const existingPermissions = await this.permissionRepository.findByIds(
      allPermissionIds
    );

    if (existingPermissions.length !== allPermissionIds.length) {
      throw new BadRequestException("One or more permissions not found");
    }

    // Start transaction to ensure data consistency
    await this.rolePermissionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Delete all existing role permissions for this role
        await transactionalEntityManager.delete(RolePermission, {
          role_id: roleId,
        });

        // Create new role permissions
        const newRolePermissions = [];

        for (const module of modulesWithPermissions) {
          for (const permission of module.permissions) {
            // Get permission details to get the correct slugs
            const permissionEntity = existingPermissions.find(
              (p) => p.id === permission.id
            );

            if (permissionEntity) {
              newRolePermissions.push({
                role_id: roleId,
                permission_id: permission.id,
                module_slug: module.moduleSlug,
                permission_slug: permission.permissionSlug,
                is_allowed: permission.isAllowed,
                created_by: loggedInUserId,
                updated_by: loggedInUserId,
                is_active: true,
              });
            }
          }
        }

        // Insert new role permissions
        if (newRolePermissions.length > 0) {
          await transactionalEntityManager.save(
            RolePermission,
            newRolePermissions
          );
        }
      }
    );

    return ResponseHelper.success(
      null,
      "Role permissions updated successfully",
      "Role",
      200
    );
  }
}
