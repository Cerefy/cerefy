import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new document' })
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of documents' })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(@Query() query: PaginationQueryDto, @Query('projectId') projectId?: string) {
    return this.documentsService.findAll(query, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details and chunks' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a document' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
