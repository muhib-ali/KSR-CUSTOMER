import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HomeCmsSection } from "../entities/home-cms-section.entity";
import { CmsController } from "./cms.controller";
import { CmsService } from "./cms.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([HomeCmsSection]),
    AuthModule,
  ],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
