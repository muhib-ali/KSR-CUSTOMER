import { Controller, Get } from "@nestjs/common";
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator
  ) {}

  @Get()
  @ApiOperation({ summary: "Overall health check" })
  @ApiResponse({
    status: 200,
    description: "Health check successful",
    schema: {
      example: {
        status: "ok",
        info: { database: { status: "up" } },
        error: {},
        details: { database: { status: "up" } },
      },
    },
  })
  @ApiResponse({ status: 503, description: "Service unavailable" })
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck("database")]);
  }

  @Get("database")
  @ApiOperation({ summary: "Database health check" })
  @ApiResponse({ status: 200, description: "Database is healthy" })
  @ApiResponse({ status: 503, description: "Database is down" })
  @HealthCheck()
  checkDatabase() {
    return this.health.check([
      () => this.db.pingCheck("database", { timeout: 300 }),
    ]);
  }
}
