import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AIProviderService } from './provider/ai-provider.service';
import { VectorStoreService } from './memory/vector-store.service';
import { KnowledgeGraphService } from './memory/knowledge-graph.service';
import { EnterpriseMemoryService } from './memory/enterprise-memory.service';
import { RAGPipelineService } from './rag/rag-pipeline.service';
import { AgentRegistryService } from './agents/agent-registry.service';
import { AgentOrchestratorService } from './agents/agent-orchestrator.service';
import { ContinuousLearningService } from './learning/learning.service';
import { ProcessIntelligenceService } from './process/process-intelligence.service';
import { AIDecisionEngineService } from './decision/ai-decision-engine.service';
import { EvaluationService } from './eval/evaluation.service';

// Specialized Agents
import { DiscoveryAgent } from './agents/specialized/discovery.agent';
import { BusinessAnalystAgent } from './agents/specialized/business-analyst.agent';
import { SolutionArchitectAgent } from './agents/specialized/solution-architect.agent';
import { DevelopmentAgent } from './agents/specialized/development.agent';
import { TestingAgent } from './agents/specialized/testing.agent';
import { GovernanceAgent } from './agents/specialized/governance.agent';

@Module({
  controllers: [AIController],
  providers: [
    AIService,
    AIProviderService,
    VectorStoreService,
    KnowledgeGraphService,
    EnterpriseMemoryService,
    RAGPipelineService,
    AgentRegistryService,
    AgentOrchestratorService,
    ContinuousLearningService,
    ProcessIntelligenceService,
    AIDecisionEngineService,
    EvaluationService,
    DiscoveryAgent,
    BusinessAnalystAgent,
    SolutionArchitectAgent,
    DevelopmentAgent,
    TestingAgent,
    GovernanceAgent,
  ],
  exports: [
    AIService,
    AIProviderService,
    EnterpriseMemoryService,
    AgentOrchestratorService,
    ContinuousLearningService,
    ProcessIntelligenceService,
    AIDecisionEngineService,
    EvaluationService,
  ],
})
export class AIModule {}
