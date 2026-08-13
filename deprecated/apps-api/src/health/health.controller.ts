import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Overall system health overview' })
  getHealth() {
    return this.healthService.checkReadiness();
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  getLiveness() {
    return this.healthService.checkLiveness();
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  getReadiness() {
    return this.healthService.checkReadiness();
  }

  @Get('database')
  @ApiOperation({ summary: 'PostgreSQL database connectivity check' })
  getDatabaseHealth() {
    return this.healthService.checkDatabase();
  }
}
