// src/enterprise/supervisor/index.ts
// Supervisor Agent — Multi-agent orchestration and routing

import { agentRegistry, AgentDefinition } from '../agent-registry';

export interface SupervisorTask {
  id: string;
  type: 'chat' | 'analysis' | 'decision' | 'workflow';
  input: string;
  context?: Record<string, unknown>;
  tenantId: string;
  userId: string;
}

export interface SupervisorResult {
  taskId: string;
  success: boolean;
  output: string;
  agentsUsed: string[];
  tokensUsed: number;
  duration: number;
}

export class SupervisorAgent {
  private taskQueue: SupervisorTask[] = [];
  private results: Map<string, SupervisorResult> = new Map();

  async executeTask(task: SupervisorTask): Promise<SupervisorResult> {
    const startTime = Date.now();
    const agentsUsed: string[] = [];
    let tokensUsed = 0;

    try {
      // Route to appropriate agent(s) based on task type
      const output = await this.routeAndExecute(task, agentsUsed, tokensUsed);

      const result: SupervisorResult = {
        taskId: task.id,
        success: true,
        output,
        agentsUsed,
        tokensUsed,
        duration: Date.now() - startTime,
      };

      this.results.set(task.id, result);
      return result;
    } catch (error) {
      const result: SupervisorResult = {
        taskId: task.id,
        success: false,
        output: error instanceof Error ? error.message : 'Unknown error',
        agentsUsed,
        tokensUsed,
        duration: Date.now() - startTime,
      };

      this.results.set(task.id, result);
      return result;
    }
  }

  private async routeAndExecute(
    task: SupervisorTask,
    agentsUsed: string[],
    tokensUsed: number
  ): Promise<string> {
    const availableAgents = agentRegistry.listAgents(task.tenantId);

    switch (task.type) {
      case 'chat':
        return this.executeChat(task, availableAgents, agentsUsed, tokensUsed);
      case 'analysis':
        return this.executeAnalysis(task, availableAgents, agentsUsed, tokensUsed);
      case 'decision':
        return this.executeDecision(task, availableAgents, agentsUsed, tokensUsed);
      case 'workflow':
        return this.executeWorkflow(task, availableAgents, agentsUsed, tokensUsed);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async executeChat(
    task: SupervisorTask,
    agents: AgentDefinition[],
    agentsUsed: string[],
    tokensUsed: number
  ): Promise<string> {
    // Find best chat agent
    const chatAgent = agents.find(a => a.type === 'chat') || agents[0];
    if (!chatAgent) {
      throw new Error('No chat agent available');
    }

    const execution = await agentRegistry.executeAgent(chatAgent.id, task.input);
    agentsUsed.push(chatAgent.id);
    tokensUsed += execution.tokens || 0;

    return execution.output || 'No response generated';
  }

  private async executeAnalysis(
    task: SupervisorTask,
    agents: AgentDefinition[],
    agentsUsed: string[],
    tokensUsed: number
  ): Promise<string> {
    // Find analyst agent
    const analystAgent = agents.find(a => a.type === 'analyst') || agents.find(a => a.type === 'ceo');
    if (!analystAgent) {
      throw new Error('No analyst agent available');
    }

    const execution = await agentRegistry.executeAgent(analystAgent.id, task.input);
    agentsUsed.push(analystAgent.id);
    tokensUsed += execution.tokens || 0;

    return execution.output || 'No analysis generated';
  }

  private async executeDecision(
    task: SupervisorTask,
    agents: AgentDefinition[],
    agentsUsed: string[],
    tokensUsed: number
  ): Promise<string> {
    // Use CEO agent for decisions
    const ceoAgent = agents.find(a => a.type === 'ceo');
    if (!ceoAgent) {
      throw new Error('No decision agent available');
    }

    const execution = await agentRegistry.executeAgent(ceoAgent.id, task.input);
    agentsUsed.push(ceoAgent.id);
    tokensUsed += execution.tokens || 0;

    return execution.output || 'No decision generated';
  }

  private async executeWorkflow(
    task: SupervisorTask,
    agents: AgentDefinition[],
    agentsUsed: string[],
    tokensUsed: number
  ): Promise<string> {
    // Execute workflow across multiple agents
    const results: string[] = [];

    for (const agent of agents.slice(0, 3)) {
      const execution = await agentRegistry.executeAgent(agent.id, task.input);
      agentsUsed.push(agent.id);
      tokensUsed += execution.tokens || 0;
      results.push(`[${agent.name}] ${execution.output}`);
    }

    return results.join('\n');
  }

  getResult(taskId: string): SupervisorResult | undefined {
    return this.results.get(taskId);
  }
}

export const supervisorAgent = new SupervisorAgent();
