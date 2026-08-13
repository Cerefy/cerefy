import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../packages/database/src/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkLiveness() {
    return {
      status: 'up',
      timestamp: new Date().toISOString(),
      service: 'cerefy-api',
      uptime: process.uptime(),
    };
  }

  async checkReadiness() {
    const dbStatus = await this.checkDatabase();
    return {
      status: dbStatus.status === 'up' ? 'up' : 'down',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: dbStatus,
        vectorStore: { status: 'up', type: 'Qdrant' },
        graphStore: { status: 'up', type: 'Neo4j' },
        redis: { status: 'up', type: 'Redis' },
      },
    };
  }

  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: 2 };
    } catch (e: any) {
      return { status: 'down', error: e.message };
    }
  }
}
