import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionInput, AgentExecutionOutput } from '../base-agent';
import { AIProviderService } from '../../provider/ai-provider.service';
import { EnterpriseMemoryService } from '../../memory/enterprise-memory.service';

@Injectable()
export class BusinessAnalystAgent extends BaseAgent {
  readonly name = 'BusinessAnalystAgent';
  readonly description = 'Transforms raw discovery inputs into structured business and functional requirements.';
  readonly role = 'Lead Business Analyst';

  constructor(aiProvider: AIProviderService, memoryService: EnterpriseMemoryService) {
    super(aiProvider, memoryService);
  }

  async plan(input: AgentExecutionInput): Promise<string[]> {
    return [
      'Deconstruct discovery insights into functional user stories',
      'Assign priority scores and acceptances criteria',
      'Validate completeness against project goals',
    ];
  }

  async execute(input: AgentExecutionInput): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    const memoryContext = await this.memoryService.buildContext(input.task, input.projectId);

    const schemaDescription = `{
      "requirements": [
        {
          "title": "string",
          "userStory": "string",
          "acceptanceCriteria": ["string"],
          "priority": 1
        }
      ]
    }`;

    const prompt = `Task: ${input.task}\n\nContext:\n${memoryContext.combinedPromptContext}\n\nGenerate structured functional requirements.`;

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
      riskAssessment: 'Requirement ambiguity minimized through acceptance criteria',
      nextSuggestedHandoff: 'SolutionArchitectAgent',
      latencyMs: Date.now() - startTime,
    };
  }

  async validate(output: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    if (!Array.isArray(output?.requirements)) errors.push('Missing requirements array');
    return { valid: errors.length === 0, errors };
  }

  async summarize(output: any): Promise<string> {
    return `Generated ${(output.requirements || []).length} structured functional requirements with acceptance criteria.`;
  }
}
