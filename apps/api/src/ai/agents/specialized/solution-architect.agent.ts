import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionInput, AgentExecutionOutput } from '../base-agent';
import { AIProviderService } from '../../provider/ai-provider.service';
import { EnterpriseMemoryService } from '../../memory/enterprise-memory.service';

@Injectable()
export class SolutionArchitectAgent extends BaseAgent {
  readonly name = 'SolutionArchitectAgent';
  readonly description = 'Synthesizes enterprise system architecture, decision records, and technical trade-offs.';
  readonly role = 'Chief Enterprise Architect';

  constructor(aiProvider: AIProviderService, memoryService: EnterpriseMemoryService) {
    super(aiProvider, memoryService);
  }

  async plan(input: AgentExecutionInput): Promise<string[]> {
    return [
      'Evaluate functional requirements against enterprise security & scalability standards',
      'Formulate architectural decision record (ADR)',
      'Assess technical risk and operational complexity',
    ];
  }

  async execute(input: AgentExecutionInput): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    const memoryContext = await this.memoryService.buildContext(input.task, input.projectId);

    const schemaDescription = `{
      "architectureTitle": "string",
      "designPattern": "string",
      "components": ["string"],
      "tradeOffs": "string",
      "riskLevel": "LOW | MEDIUM | HIGH",
      "recommendation": "string"
    }`;

    const prompt = `Task: ${input.task}\n\nContext:\n${memoryContext.combinedPromptContext}\n\nFormulate enterprise architecture plan.`;

    const { data } = await this.aiProvider.generateStructuredJSON<any>(prompt, schemaDescription, {
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
      riskAssessment: `Risk Level: ${data.riskLevel || 'MEDIUM'}. Trade-offs: ${data.tradeOffs || 'Standard architectural balance'}`,
      nextSuggestedHandoff: 'GovernanceAgent',
      latencyMs: Date.now() - startTime,
    };
  }

  async validate(output: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    if (!output?.architectureTitle) errors.push('Missing architecture title');
    if (!output?.designPattern) errors.push('Missing design pattern');
    return { valid: errors.length === 0, errors };
  }

  async summarize(output: any): Promise<string> {
    return `Formulated architecture blueprint: ${output.architectureTitle} utilizing ${output.designPattern} pattern with ${(output.components || []).length} subsystems.`;
  }
}
