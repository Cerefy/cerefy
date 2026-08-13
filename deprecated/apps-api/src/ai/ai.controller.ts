import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { ExecuteAgentDto } from './dto/execute-agent.dto';
import { RunPipelineDto } from './dto/run-pipeline.dto';
import { IngestDocumentDto } from './dto/ingest-doc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI Core & Multi-Agent OS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get('agents')
  @ApiOperation({ summary: 'List all registered AI specialized agents' })
  listAgents() {
    return this.aiService.listAgents();
  }

  @Post('agents/execute')
  @ApiOperation({ summary: 'Execute a single specialized AI agent with evaluation' })
  executeAgent(@Body() dto: ExecuteAgentDto) {
    return this.aiService.executeAgent(dto);
  }

  @Post('pipeline/run')
  @ApiOperation({ summary: 'Run a multi-agent orchestration pipeline' })
  runPipeline(@Body() dto: RunPipelineDto) {
    return this.aiService.runPipeline(dto);
  }

  @Post('rag/ingest')
  @ApiOperation({ summary: 'Ingest and chunk document into RAG vector store' })
  ingestDocument(@Body() dto: IngestDocumentDto) {
    return this.aiService.ingestDocument(dto);
  }

  @Get('memory/query')
  @ApiOperation({ summary: 'Perform hybrid RAG vector + graph memory retrieval' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'projectId', required: false })
  queryMemory(@Query('query') query: string, @Query('projectId') projectId?: string) {
    return this.aiService.queryMemory(query, projectId);
  }

  @Get('graph/impact/:nodeId')
  @ApiOperation({ summary: 'Perform knowledge graph impact & dependency analysis' })
  getGraphImpact(@Param('nodeId') nodeId: string) {
    return this.aiService.getGraphImpact(nodeId);
  }

  @Post('learning/feedback')
  @ApiOperation({ summary: 'Submit feedback to Continuous Learning Engine' })
  recordFeedback(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.aiService.recordFeedback({ ...body, userId });
  }

  @Get('learning/patterns')
  @ApiOperation({ summary: 'Get high-confidence learned organizational patterns' })
  @ApiQuery({ name: 'term', required: false })
  getLearnedPatterns(@Query('term') term?: string) {
    return this.aiService.getLearnedPatterns(term);
  }

  @Post('process/synthesize')
  @ApiOperation({ summary: 'Synthesize DB schema and API contracts from BPMN process diagram' })
  synthesizeProcess(@Body() body: any) {
    return this.aiService.synthesizeProcess(body);
  }

  @Get('decision/conflicts/:projectId')
  @ApiOperation({ summary: 'Detect requirement conflicts & constraint violations' })
  detectConflicts(@Param('projectId') projectId: string) {
    return this.aiService.detectConflicts(projectId);
  }

  @Get('decision/impact/:decisionId')
  @ApiOperation({ summary: 'Predict change impact & dev estimate for architecture decision' })
  predictChangeImpact(@Param('decisionId') decisionId: string) {
    return this.aiService.predictChangeImpact(decisionId);
  }
}
