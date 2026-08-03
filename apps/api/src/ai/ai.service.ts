import { Injectable } from '@nestjs/common';
import { AgentRegistryService } from './agents/agent-registry.service';
import { AgentOrchestratorService } from './agents/agent-orchestrator.service';
import { RAGPipelineService } from './rag/rag-pipeline.service';
import { EnterpriseMemoryService } from './memory/enterprise-memory.service';
import { KnowledgeGraphService } from './memory/knowledge-graph.service';
import { ContinuousLearningService, FeedbackInput } from './learning/learning.service';
import { ProcessIntelligenceService, ProcessMappingInput } from './process/process-intelligence.service';
import { AIDecisionEngineService } from './decision/ai-decision-engine.service';
import { EvaluationService } from './eval/evaluation.service';
import { ExecuteAgentDto } from './dto/execute-agent.dto';
import { RunPipelineDto } from './dto/run-pipeline.dto';
import { IngestDocumentDto } from './dto/ingest-doc.dto';

@Injectable()
export class AIService {
  constructor(
    private readonly registry: AgentRegistryService,
    private readonly orchestrator: AgentOrchestratorService,
    private readonly ragPipeline: RAGPipelineService,
    private readonly memory: EnterpriseMemoryService,
    private readonly knowledgeGraph: KnowledgeGraphService,
    private readonly learning: ContinuousLearningService,
    private readonly processIntelligence: ProcessIntelligenceService,
    private readonly decisionEngine: AIDecisionEngineService,
    private readonly evaluation: EvaluationService,
  ) {}

  listAgents() {
    return this.registry.listAgents();
  }

  async executeAgent(dto: ExecuteAgentDto) {
    const agent = this.registry.getAgent(dto.agentName);
    const result = await agent.execute({
      projectId: dto.projectId,
      task: dto.task,
      context: dto.context,
    });

    const qualityEval = await this.evaluation.evaluateOutput(result.data, JSON.stringify(dto.context));
    return {
      ...result,
      qualityEvaluation: qualityEval,
    };
  }

  async runPipeline(dto: RunPipelineDto) {
    return this.orchestrator.runPipeline(dto);
  }

  async ingestDocument(dto: IngestDocumentDto) {
    return this.ragPipeline.processDocument(dto);
  }

  async queryMemory(query: string, projectId?: string) {
    return this.memory.buildContext(query, projectId);
  }

  async getGraphImpact(nodeId: string) {
    return this.knowledgeGraph.getImpactGraph(nodeId);
  }

  async recordFeedback(input: FeedbackInput) {
    return this.learning.recordFeedback(input);
  }

  async getLearnedPatterns(term?: string) {
    return this.learning.getLearnedPatterns(term);
  }

  async synthesizeProcess(input: ProcessMappingInput) {
    return this.processIntelligence.parseAndSynthesize(input);
  }

  async detectConflicts(projectId: string) {
    return this.decisionEngine.detectConflicts(projectId);
  }

  async predictChangeImpact(decisionId: string) {
    return this.decisionEngine.predictChangeImpact(decisionId);
  }
}
