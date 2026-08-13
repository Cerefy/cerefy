import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionInput, AgentExecutionOutput } from '../base-agent';
import { AIProviderService } from '../../provider/ai-provider.service';
import { EnterpriseMemoryService } from '../../memory/enterprise-memory.service';

@Injectable()
export class TestingAgent extends BaseAgent {
  readonly name = 'TestingAgent';
  readonly description = 'Formulates automated test suites, verification plans, and edge-case regression scenarios.';
  readonly role = 'Lead QA & Test Automation Engineer';

  constructor(aiProvider: AIProviderService, memoryService: EnterpriseMemoryService) {
    super(aiProvider, memoryService);
  }

  async plan(input: AgentExecutionInput): Promise<string[]> {
    return [
      'Extract acceptance criteria from requirements',
      'Generate unit, integration, and E2E verification test cases',
      'Assess code coverage and security edge cases',
    ];
  }

  async execute(input: AgentExecutionInput): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    const memoryContext = await this.memoryService.buildContext(input.task, input.projectId);

    const schemaDescription = `{
      "testSuiteName": "string",
      "testCases": [
        {
          "name": "string",
          "given": "string",
          "when": "string",
          "then": "string"
        }
      ],
      "estimatedCoverage": "string"
    }`;

    const prompt = `Task: ${input.task}\n\nContext:\n${memoryContext.combinedPromptContext}\n\nGenerate automated test suite.`;

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
      riskAssessment: 'High test coverage minimizes regression risks.',
      nextSuggestedHandoff: 'GovernanceAgent',
      latencyMs: Date.now() - startTime,
    };
  }

  async validate(output: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    if (!Array.isArray(output?.testCases)) errors.push('Missing testCases array');
    return { valid: errors.length === 0, errors };
  }

  async summarize(output: any): Promise<string> {
    return `Formulated test suite ${output.testSuiteName || 'Verification Plan'} with ${(output.testCases || []).length} test cases (${output.estimatedCoverage || '90%'} coverage).`;
  }
}
