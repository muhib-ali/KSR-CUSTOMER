import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsController } from "./permissions.controller";
import { PermissionsService } from "./permissions.service";
import { Permission } from "../entities/permission.entity";
import { Module as ModuleEntity } from "../entities/module.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Permission, ModuleEntity])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
