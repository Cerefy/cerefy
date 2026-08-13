import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConnectorsService } from './connectors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Enterprise Integration Connectors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('connectors')
export class ConnectorsController {
  constructor(private readonly connectorsService: ConnectorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all supported Enterprise Connectors (SAP, Jira, Dynamics, Salesforce, etc.)' })
  listConnectors() {
    return this.connectorsService.listConnectors();
  }

  @Post(':id/test')
  @Roles(Role.SUPERADMIN, Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Test live API connectivity for an enterprise connector' })
  testConnection(@Param('id') id: string) {
    return this.connectorsService.testConnection(id);
  }

  @Post(':id/sync')
  @Roles(Role.SUPERADMIN, Role.ORG_ADMIN, Role.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Trigger automated data sync from enterprise system into Cerefy Memory' })
  syncConnectorData(@Param('id') id: string, @Body('projectId') projectId: string) {
    return this.connectorsService.syncConnectorData(id, projectId);
  }
}
