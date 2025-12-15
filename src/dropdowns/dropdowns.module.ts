import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DropdownsController } from "./dropdowns.controller";
import { DropdownsService } from "./dropdowns.service";
import { Role } from "../entities/role.entity";
import { Module as ModuleEntity } from "../entities/module.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Role, ModuleEntity]), AuthModule],
  controllers: [DropdownsController],
  providers: [DropdownsService],
  exports: [DropdownsService],
})
export class DropdownsModule {}
