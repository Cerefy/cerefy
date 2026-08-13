import { Injectable, Logger } from '@nestjs/common';
import { AgentRegistryService } from './agent-registry.service';
import { AgentExecutionInput, AgentExecutionOutput } from './base-agent';
import { PrismaService } from '../../../../../packages/database/src/prisma.service';

export interface WorkflowPipelineRequest {
  projectId: string;
  initialTask: string;
  pipelineSequence?: string[];
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(
    private readonly registry: AgentRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async runPipeline(request: WorkflowPipelineRequest) {
    const sequence = request.pipelineSequence || [
      'DiscoveryAgent',
      'BusinessAnalystAgent',
      'SolutionArchitectAgent',
      'GovernanceAgent',
    ];

    const results: AgentExecutionOutput[] = [];
    let currentInput: AgentExecutionInput = {
      projectId: request.projectId,
      task: request.initialTask,
    };

    for (const agentName of sequence) {
      this.logger.log(`Executing step in pipeline with Agent: ${agentName}`);
      const agent = this.registry.getAgent(agentName);

      // Record agent run start in Prisma
      const runRecord = await this.prisma.agentRun.create({
        data: {
          agentName,
          status: 'RUNNING',
          payload: { input: currentInput },
        },
      });

      try {
        const output = await agent.execute(currentInput);
        results.push(output);

        // Update run status in DB
        await this.prisma.agentRun.update({
          where: { id: runRecord.id },
          data: {
            status: output.success ? 'COMPLETED' : 'FAILED',
            finishedAt: new Date(),
            payload: output,
          },
        });

        // Pass context forward to next agent
        currentInput = {
          ...currentInput,
          context: output.data,
          task: `Previous step output by ${agentName}: ${output.summary}. Perform next task in sequence.`,
        };
      } catch (err: any) {
        this.logger.error(`Agent run failed for ${agentName}: ${err.message}`);
        await this.prisma.agentRun.update({
          where: { id: runRecord.id },
          data: {
            status: 'FAILED',
            finishedAt: new Date(),
            payload: { error: err.message },
          },
        });
        throw err;
      }
    }

    return {
      pipelineCompleted: true,
      totalSteps: results.length,
      steps: results,
    };
  }
}
