import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Enterprise Analytics & Executive Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('executive-kpis')
  @ApiOperation({ summary: 'Get C-level executive KPIs, time saved, and governance metrics' })
  getExecutiveKPIs(@CurrentUser('organizationId') orgId?: string) {
    return this.analyticsService.getExecutiveKPIs(orgId);
  }

  @Get('agent-performance')
  @ApiOperation({ summary: 'Get agent run breakdown, latency, and success rates' })
  getAgentMetrics() {
    return this.analyticsService.getAgentMetrics();
  }
}
