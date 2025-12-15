import { Module as NestModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ModulesController } from "./modules.controller";
import { ModulesService } from "./modules.service";
import { Module } from "../entities/module.entity";

@NestModule({
  imports: [TypeOrmModule.forFeature([Module])],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
