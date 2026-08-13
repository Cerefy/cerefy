import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { BaseAgent } from './base-agent';
import { DiscoveryAgent } from './specialized/discovery.agent';
import { BusinessAnalystAgent } from './specialized/business-analyst.agent';
import { SolutionArchitectAgent } from './specialized/solution-architect.agent';
import { DevelopmentAgent } from './specialized/development.agent';
import { TestingAgent } from './specialized/testing.agent';
import { GovernanceAgent } from './specialized/governance.agent';

@Injectable()
export class AgentRegistryService implements OnModuleInit {
  private readonly agents = new Map<string, BaseAgent>();

  constructor(
    private readonly discoveryAgent: DiscoveryAgent,
    private readonly baAgent: BusinessAnalystAgent,
    private readonly architectAgent: SolutionArchitectAgent,
    private readonly devAgent: DevelopmentAgent,
    private readonly testAgent: TestingAgent,
    private readonly govAgent: GovernanceAgent,
  ) {}

  onModuleInit() {
    this.register(this.discoveryAgent);
    this.register(this.baAgent);
    this.register(this.architectAgent);
    this.register(this.devAgent);
    this.register(this.testAgent);
    this.register(this.govAgent);
  }

  register(agent: BaseAgent) {
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): BaseAgent {
    const agent = this.agents.get(name);
    if (!agent) throw new NotFoundException(`Agent '${name}' is not registered`);
    return agent;
  }

  listAgents() {
    return Array.from(this.agents.values()).map((a) => ({
      name: a.name,
      description: a.description,
      role: a.role,
    }));
  }
}
