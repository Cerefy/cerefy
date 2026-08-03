import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionInput, AgentExecutionOutput } from '../base-agent';
import { AIProviderService } from '../../provider/ai-provider.service';
import { EnterpriseMemoryService } from '../../memory/enterprise-memory.service';

@Injectable()
export class GovernanceAgent extends BaseAgent {
  readonly name = 'GovernanceAgent';
  readonly description = 'Validates policy compliance, risk thresholds, security standards, and requires approval routing.';
  readonly role = 'Chief Information Security & Governance Officer';

  constructor(aiProvider: AIProviderService, memoryService: EnterpriseMemoryService) {
    super(aiProvider, memoryService);
  }

  async plan(input: AgentExecutionInput): Promise<string[]> {
    return [
      'Evaluate agent outputs against SOC2, GDPR, and enterprise security policies',
      'Compute composite risk score (0-100)',
      'Determine if human approval sign-off is mandatory',
    ];
  }

  async execute(input: AgentExecutionInput): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    const memoryContext = await this.memoryService.buildContext(input.task, input.projectId);

    const schemaDescription = `{
      "policyCompliant": true,
      "riskScore": 15,
      "complianceChecks": [
        { "policy": "string", "passed": true, "notes": "string" }
      ],
      "requiresHumanApproval": true,
      "mandatoryApprovers": ["string"]
    }`;

    const prompt = `Task: ${input.task}\n\nContext:\n${memoryContext.combinedPromptContext}\n\nPerform enterprise governance validation.`;

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
      riskAssessment: `Calculated Risk Score: ${data.riskScore}/100. Policy Compliant: ${data.policyCompliant}`,
      nextSuggestedHandoff: data.requiresHumanApproval ? 'HumanApprovalGate' : 'ExecutionComplete',
      latencyMs: Date.now() - startTime,
    };
  }

  async validate(output: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    if (typeof output?.riskScore !== 'number') errors.push('Risk score must be a numeric value');
    if (typeof output?.policyCompliant !== 'boolean') errors.push('policyCompliant must be boolean');
    return { valid: errors.length === 0, errors };
  }

  async summarize(output: any): Promise<string> {
    return `Governance audit complete. Risk Score: ${output.riskScore}/100. Compliance: ${output.policyCompliant ? 'PASSED' : 'FAILED'}. Requires Human Sign-off: ${output.requiresHumanApproval}.`;
  }
}
