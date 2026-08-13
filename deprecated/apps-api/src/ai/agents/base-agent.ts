import { AIProviderService } from '../provider/ai-provider.service';
import { EnterpriseMemoryService } from '../memory/enterprise-memory.service';

export interface AgentExecutionInput {
  projectId: string;
  task: string;
  context?: any;
}

export interface AgentExecutionOutput {
  agentName: string;
  success: boolean;
  data: any;
  confidenceScore: number;
  summary: string;
  riskAssessment: string;
  nextSuggestedHandoff?: string;
  latencyMs: number;
}

export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly role: string;

  constructor(
    protected readonly aiProvider: AIProviderService,
    protected readonly memoryService: EnterpriseMemoryService,
  ) {}

  abstract plan(input: AgentExecutionInput): Promise<string[]>;

  abstract execute(input: AgentExecutionInput): Promise<AgentExecutionOutput>;

  abstract validate(output: any): Promise<{ valid: boolean; errors?: string[] }>;

  abstract summarize(output: any): Promise<string>;

  protected calculateConfidence(rawText: string, valid: boolean): number {
    if (!valid) return 0.45;
    const wordCount = rawText.split(/\s+/).length;
    if (wordCount < 20) return 0.70;
    return Math.min(0.98, 0.85 + Math.random() * 0.12);
  }
}
