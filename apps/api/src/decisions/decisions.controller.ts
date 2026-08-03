import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DecisionsService } from './decisions.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { ApproveDecisionDto } from './dto/approve-decision.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI Governance & Decisions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post()
  @ApiOperation({ summary: 'Register an AI architecture decision' })
  create(@Body() dto: CreateDecisionDto) {
    return this.decisionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of AI decisions' })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(@Query() query: PaginationQueryDto, @Query('projectId') projectId?: string) {
    return this.decisionsService.findAll(query, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get decision audit trace' })
  findOne(@Param('id') id: string) {
    return this.decisionsService.findOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Submit approval/rejection for an AI decision' })
  approve(
    @Param('id') id: string,
    @CurrentUser('id') approverId: string,
    @Body() dto: ApproveDecisionDto,
  ) {
    return this.decisionsService.approve(id, approverId, dto);
  }
}
