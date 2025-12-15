import { Global, Module } from "@nestjs/common";
import { AppConfigService } from "../config/config.service";
import { CacheService } from "../cache/cache.service";

@Global()
@Module({
  providers: [AppConfigService, CacheService],
  exports: [AppConfigService, CacheService],
})
export class SharedModule {}
