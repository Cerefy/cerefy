import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@packages/database/src/prisma.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class RequirementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRequirementDto) {
    return this.prisma.requirement.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        sourceDocument: dto.sourceDocument,
        priority: dto.priority || 3,
        status: dto.status || 'ACTIVE',
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
      this.prisma.requirement.count({ where }),
      this.prisma.requirement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
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
    const req = await this.prisma.requirement.findFirst({
      where: { id, deletedAt: null },
    });
    if (!req) throw new NotFoundException(`Requirement with ID ${id} not found`);
    return req;
  }

  async update(id: string, dto: UpdateRequirementDto) {
    await this.findOne(id);
    return this.prisma.requirement.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.requirement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true, message: 'Requirement deleted' };
  }
}
