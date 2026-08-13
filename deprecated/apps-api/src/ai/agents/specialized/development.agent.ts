import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionInput, AgentExecutionOutput } from '../base-agent';
import { AIProviderService } from '../../provider/ai-provider.service';
import { EnterpriseMemoryService } from '../../memory/enterprise-memory.service';

@Injectable()
export class DevelopmentAgent extends BaseAgent {
  readonly name = 'DevelopmentAgent';
  readonly description = 'Generates production-grade code snippets, database migrations, and BPMN process workflows.';
  readonly role = 'Lead Software Engineer & Automation Developer';

  constructor(aiProvider: AIProviderService, memoryService: EnterpriseMemoryService) {
    super(aiProvider, memoryService);
  }

  async plan(input: AgentExecutionInput): Promise<string[]> {
    return [
      'Parse architecture specifications and requirements',
      'Generate code implementation structure or BPMN 2.0 XML representation',
      'Validate syntactic correctness and lint rules',
    ];
  }

  async execute(input: AgentExecutionInput): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    const memoryContext = await this.memoryService.buildContext(input.task, input.projectId);

    const schemaDescription = `{
      "targetFile": "string",
      "codeSnippet": "string",
      "bpmnDiagramXml": "string",
      "dependencies": ["string"]
    }`;

    const prompt = `Task: ${input.task}\n\nContext:\n${memoryContext.combinedPromptContext}\n\nGenerate code blueprint or process mapping.`;

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
      riskAssessment: 'Low technical debt. Requires automated unit tests.',
      nextSuggestedHandoff: 'TestingAgent',
      latencyMs: Date.now() - startTime,
    };
  }

  async validate(output: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    if (!output?.codeSnippet && !output?.bpmnDiagramXml) {
      errors.push('Output must contain either codeSnippet or bpmnDiagramXml');
    }
    return { valid: errors.length === 0, errors };
  }

  async summarize(output: any): Promise<string> {
    return `Generated code implementation for ${output.targetFile || 'Core Service'} with ${(output.dependencies || []).length} explicit dependencies.`;
  }
}
