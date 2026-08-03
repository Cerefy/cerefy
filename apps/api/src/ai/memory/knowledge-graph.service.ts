import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../packages/database/src/prisma.service';
import { EntityType } from '@prisma/client';

export interface CreateNodeDto {
  entityType: EntityType;
  content: string;
  metadata?: any;
}

export interface CreateEdgeDto {
  fromNodeId: string;
  toNodeId: string;
  relationship: string;
}

@Injectable()
export class KnowledgeGraphService {
  private readonly logger = new Logger(KnowledgeGraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNode(dto: CreateNodeDto) {
    return this.prisma.knowledgeNode.create({
      data: {
        entityType: dto.entityType,
        content: dto.content,
        metadata: dto.metadata || {},
      },
    });
  }

  async createEdge(dto: CreateEdgeDto) {
    return this.prisma.knowledgeEdge.create({
      data: {
        fromNodeId: dto.fromNodeId,
        toNodeId: dto.toNodeId,
        relationship: dto.relationship,
      },
    });
  }

  async getImpactGraph(nodeId: string, depth = 2) {
    const node = await this.prisma.knowledgeNode.findUnique({
      where: { id: nodeId },
      include: {
        edgesFrom: { include: { toNode: true } },
        edgesTo: { include: { fromNode: true } },
      },
    });

    if (!node) return null;

    const downstreamImpacts = node.edgesFrom.map((e) => ({
      node: e.toNode,
      relationship: e.relationship,
    }));

    const upstreamDependencies = node.edgesTo.map((e) => ({
      node: e.fromNode,
      relationship: e.relationship,
    }));

    return {
      rootNode: node,
      downstreamImpacts,
      upstreamDependencies,
      impactScore: (downstreamImpacts.length * 15) + (upstreamDependencies.length * 10),
    };
  }

  async searchGraph(term: string) {
    return this.prisma.knowledgeNode.findMany({
      where: {
        content: { contains: term, mode: 'insensitive' },
        deletedAt: null,
      },
      include: {
        edgesFrom: true,
        edgesTo: true,
      },
      take: 20,
    });
  }
}
