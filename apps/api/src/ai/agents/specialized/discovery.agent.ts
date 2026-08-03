import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionInput, AgentExecutionOutput } from '../base-agent';
import { AIProviderService } from '../../provider/ai-provider.service';
import { EnterpriseMemoryService } from '../../memory/enterprise-memory.service';

@Injectable()
export class DiscoveryAgent extends BaseAgent {
  readonly name = 'DiscoveryAgent';
  readonly description = 'Ingests enterprise documentation to extract systems, stakeholders, and scope limits.';
  readonly role = 'Enterprise Business Discovery Lead';

  constructor(aiProvider: AIProviderService, memoryService: EnterpriseMemoryService) {
    super(aiProvider, memoryService);
  }

  async plan(input: AgentExecutionInput): Promise<string[]> {
    return [
      'Query vector store & knowledge graph for domain artifacts',
      'Identify key enterprise stakeholders and legacy software integrations',
      'Synthesize scope boundaries and operational constraints',
    ];
  }

  async execute(input: AgentExecutionInput): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    const memoryContext = await this.memoryService.buildContext(input.task, input.projectId);

    const schemaDescription = `{
      "stakeholders": ["string"],
      "legacySystems": ["string"],
      "scopeSummary": "string",
      "identifiedRisks": ["string"]
    }`;

    const prompt = `Task: ${input.task}\n\nContext:\n${memoryContext.combinedPromptContext}\n\nExtract enterprise discovery details.`;

    const { data, latencyMs } = await this.aiProvider.generateStructuredJSON<any>(prompt, schemaDescription, {
      systemPrompt: `You are the ${this.role}. ${this.description}`,
    });

    const validation = await this.validate(data);
    const confidenceScore = this.calculateConfidence(JSON.stringify(data), validation.valid);
    const summary = await this.summarize(data);

    return {
      agentName: this.name,
      success: validation.valid,
      data,
      confidenceScore,
      summary,
      riskAssessment: (data.identifiedRisks || []).join('; ') || 'Low operational risk identified',
      nextSuggestedHandoff: 'BusinessAnalystAgent',
      latencyMs: Date.now() - startTime,
    };
  }

  async validate(output: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    if (!output || typeof output !== 'object') errors.push('Output must be an object');
    if (!Array.isArray(output.stakeholders)) errors.push('Missing stakeholders array');
    return { valid: errors.length === 0, errors };
  }

  async summarize(output: any): Promise<string> {
    return `Discovered ${(output.stakeholders || []).length} key stakeholders and ${(output.legacySystems || []).length} legacy integrations. Scope: ${output.scopeSummary || 'Standard enterprise rollout'}.`;
  }
}
