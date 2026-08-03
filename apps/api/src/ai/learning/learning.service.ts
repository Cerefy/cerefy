import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../packages/database/src/prisma.service';

export interface FeedbackInput {
  agentRunId?: string;
  decisionId?: string;
  rating: number; // 1 to 5
  feedbackText?: string;
  approved: boolean;
  userId: string;
}

@Injectable()
export class ContinuousLearningService {
  private readonly logger = new Logger(ContinuousLearningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordFeedback(input: FeedbackInput) {
    this.logger.log(`Recording feedback for decision/run. Rating: ${input.rating}, Approved: ${input.approved}`);

    // Update Decision approval or record audit pattern
    if (input.decisionId) {
      await this.prisma.decision.update({
        where: { id: input.decisionId },
        data: {
          approvalStatus: input.approved ? 'APPROVED' : 'REJECTED',
          approvedBy: input.userId,
        },
      });
    }

    // Save as Knowledge Node pattern if rating >= 4
    if (input.rating >= 4 && input.feedbackText) {
      await this.prisma.knowledgeNode.create({
        data: {
          entityType: 'DECISION',
          content: `LEARNED PATTERN: ${input.feedbackText}`,
          metadata: {
            rating: input.rating,
            approvedBy: input.userId,
            agentRunId: input.agentRunId,
          },
        },
      });
    }

    return {
      success: true,
      feedbackRecorded: true,
      learnedPatternSaved: input.rating >= 4,
    };
  }

  async getLearnedPatterns(term?: string) {
    const where: any = {
      content: { startsWith: 'LEARNED PATTERN:' },
    };
    if (term) {
      where.content = { contains: term, mode: 'insensitive' };
    }

    return this.prisma.knowledgeNode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
