import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { Module } from "../entities/module.entity";
import { ResponseHelper } from "../common/helpers/response.helper";
import { ApiResponse } from "../common/interfaces/api-response.interface";

@Injectable()
export class DropdownsService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>
  ) {}

  async getAllRoles(): Promise<ApiResponse<any>> {
    const roles = await this.roleRepository.find({
      where: { is_active: true },
      select: ["id", "title"],
      order: { title: "ASC" },
    });

    const rolesDropdown = roles.map((role) => ({
      label: role.title,
      value: role.id,
    }));

    return ResponseHelper.success(
      { rolesDropdown },
      "Roles dropdown data retrieved successfully",
      "Dropdowns"
    );
  }

  async getAllModules(): Promise<ApiResponse<any>> {
    const modules = await this.moduleRepository.find({
      where: { is_active: true },
      select: ["id", "title"],
      order: { title: "ASC" },
    });

    const modulesDropdown = modules.map((module) => ({
      label: module.title,
      value: module.id,
    }));

    return ResponseHelper.success(
      { modulesDropdown },
      "Modules dropdown data retrieved successfully",
      "Dropdowns"
    );
  }
}
