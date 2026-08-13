import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../packages/database/src/prisma.service';
import { EntityType } from '@prisma/client';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination.dto';

export interface CreateAuditLogOptions {
  tenantId?: string;
  entityId: string;
  entityType: EntityType;
  actorId?: string;
  actorType: string;
  action: string;
  payload?: any;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(options: CreateAuditLogOptions) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: options.tenantId,
        entityId: options.entityId,
        entityType: options.entityType,
        actorId: options.actorId,
        actorType: options.actorType,
        action: options.action,
        payload: options.payload || {},
      },
    });
  }

  async findAll(query: PaginationQueryDto, tenantId?: string): Promise<PaginatedResult<any>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.search) {
      where.action = { contains: query.search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
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
}
