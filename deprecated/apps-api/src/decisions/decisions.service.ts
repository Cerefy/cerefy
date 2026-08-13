import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../packages/database/src/prisma.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { ApproveDecisionDto } from './dto/approve-decision.dto';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class DecisionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDecisionDto) {
    return this.prisma.decision.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        agent: dto.agent,
        decisionType: dto.decisionType,
        inputContext: dto.inputContext,
        aiOutput: dto.aiOutput,
        confidenceScore: dto.confidenceScore,
        riskLevel: dto.riskLevel,
        approvalStatus: 'PENDING',
      },
    });
  }

  async findAll(query: PaginationQueryDto, projectId?: string): Promise<PaginatedResult<any>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (projectId) {
      where.projectId = projectId;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.decision.count({ where }),
      this.prisma.decision.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          approvals: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const dec = await this.prisma.decision.findFirst({
      where: { id, deletedAt: null },
      include: { approvals: true },
    });
    if (!dec) throw new NotFoundException(`Decision with ID ${id} not found`);
    return dec;
  }

  async approve(id: string, approverId: string, dto: ApproveDecisionDto) {
    await this.findOne(id);

    const [approval, updatedDecision] = await this.prisma.$transaction([
      this.prisma.approval.create({
        data: {
          decisionId: id,
          approverId,
          status: dto.status,
          comment: dto.comment,
        },
      }),
      this.prisma.decision.update({
        where: { id },
        data: {
          approvalStatus: dto.status,
          approvedBy: approverId,
        },
      }),
    ]);

    return { approval, decision: updatedDecision };
  }
}
