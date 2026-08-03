import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../packages/database/src/prisma.service';
import { AIProviderService } from '../provider/ai-provider.service';

export interface ProcessMappingInput {
  processMapId?: string;
  name: string;
  bpmnJson: string;
  projectId: string;
}

@Injectable()
export class ProcessIntelligenceService {
  private readonly logger = new Logger(ProcessIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: AIProviderService,
  ) {}

  async parseAndSynthesize(input: ProcessMappingInput) {
    this.logger.log(`Parsing Process Map: ${input.name}`);

    // Store or update ProcessMap in Prisma
    const processRecord = await this.prisma.processMap.create({
      data: {
        name: input.name,
        bpmnJson: input.bpmnJson,
        projectId: input.projectId,
      },
    });

    const schemaDescription = `{
      "generatedEntities": [
        { "name": "string", "fields": ["string"], "relationships": ["string"] }
      ],
      "apiEndpoints": [
        { "method": "POST | GET | PUT | DELETE", "path": "string", "description": "string" }
      ],
      "userStories": ["string"],
      "suggestedAutomation": "string"
    }`;

    const prompt = `Analyze BPMN Process Diagram (${input.name}):\n\n${input.bpmnJson}\n\nSynthesize production database entities, REST API contracts, and user stories required to execute this process.`;

    const { data } = await this.aiProvider.generateStructuredJSON<any>(prompt, schemaDescription, {
      systemPrompt: 'You are an Enterprise Process Intelligence Architect.',
    });

    return {
      processMapId: processRecord.id,
      name: processRecord.name,
      synthesizedBlueprint: data,
    };
  }
}
