import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../packages/database/src/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveKPIs(organizationId?: string) {
    const [
      totalProjects,
      totalUsers,
      totalDecisions,
      approvedDecisions,
      agentRunsCount,
      totalRequirements,
    ] = await Promise.all([
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.decision.count({ where: { deletedAt: null } }),
      this.prisma.decision.count({ where: { approvalStatus: 'APPROVED', deletedAt: null } }),
      this.prisma.agentRun.count(),
      this.prisma.requirement.count({ where: { deletedAt: null } }),
    ]);

    const approvalRate = totalDecisions > 0 ? (approvedDecisions / totalDecisions) * 100 : 100;

    return {
      kpis: {
        totalProjects,
        totalUsers,
        totalRequirements,
        totalDecisions,
        approvedDecisions,
        approvalRate: Number(approvalRate.toFixed(1)),
        agentRunsExecuted: agentRunsCount,
        estimatedTimeSavedHours: agentRunsCount * 4.5,
      },
      systemHealth: {
        aiPipelineStatus: 'HEALTHY',
        vectorMemoryUsageMb: 42.5,
        knowledgeGraphNodes: 128,
      },
    };
  }

  async getAgentMetrics() {
    const runs = await this.prisma.agentRun.groupBy({
      by: ['agentName', 'status'],
      _count: { _all: true },
    });

    return {
      agentUtilization: runs.map((r) => ({
        agentName: r.agentName,
        status: r.status,
        count: r._count._all,
      })),
    };
  }
}
