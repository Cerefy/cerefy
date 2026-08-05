import { Injectable } from '@nestjs/common';
import { PrismaService } from '@packages/database/src/prisma.service';
import { AIProviderService } from '../provider/ai-provider.service';

export interface ConflictCheckInput {
  projectId: string;
}

@Injectable()
export class AIDecisionEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: AIProviderService,
  ) {}

  async detectConflicts(projectId: string) {
    const requirements = await this.prisma.requirement.findMany({
      where: { projectId, deletedAt: null },
    });

    if (requirements.length < 2) {
      return {
        conflictsFound: false,
        conflictList: [],
        message: 'Insufficient requirements to run conflict detection.',
      };
    }

    const reqText = requirements.map((r) => `ID: ${r.id} | Title: ${r.title} | Desc: ${r.description}`).join('\n');

    const schemaDescription = `{
      "conflictsFound": true,
      "conflictList": [
        {
          "requirementAId": "string",
          "requirementBId": "string",
          "conflictDescription": "string",
          "severity": "HIGH | MEDIUM | LOW",
          "resolutionStrategy": "string"
        }
      ]
    }`;

    const prompt = `Analyze requirements list for logical conflicts or opposing constraints:\n\n${reqText}`;

    const { data } = await this.aiProvider.generateStructuredJSON<any>(prompt, schemaDescription, {
      systemPrompt: 'You are an AI Conflict & Constraint Verification Engine.',
    });

    return data;
  }

  async predictChangeImpact(decisionId: string) {
    const decision = await this.prisma.decision.findUnique({
      where: { id: decisionId },
      include: { project: { include: { requirements: true, processMaps: true } } },
    });

    if (!decision) throw new Error('Decision not found');

    const schemaDescription = `{
      "impactScore": 45,
      "affectedComponents": ["string"],
      "estimatedDevHours": 80,
      "riskMitigation": "string",
      "alternatives": ["string"]
    }`;

    const prompt = `Assess change impact for decision: "${decision.title}" (${decision.description}). Project requirements count: ${decision.project.requirements.length}.`;

    const { data } = await this.aiProvider.generateStructuredJSON<any>(prompt, schemaDescription, {
      systemPrompt: 'You are an Enterprise Change Impact Predictor.',
    });

    return data;
  }
}
