import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequirementsService } from './requirements.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Requirements Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requirements')
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project requirement' })
  create(@Body() dto: CreateRequirementDto) {
    return this.requirementsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get requirements list' })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(@Query() query: PaginationQueryDto, @Query('projectId') projectId?: string) {
    return this.requirementsService.findAll(query, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get requirement details' })
  findOne(@Param('id') id: string) {
    return this.requirementsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update requirement' })
  update(@Param('id') id: string, @Body() dto: UpdateRequirementDto) {
    return this.requirementsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete requirement' })
  remove(@Param('id') id: string) {
    return this.requirementsService.remove(id);
  }
}
