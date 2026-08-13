import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../packages/database/src/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Workspace slug already taken');
    }

    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        organizationId: dto.organizationId,
      },
    });
  }

  async findAll(query: PaginationQueryDto, organizationId?: string): Promise<PaginatedResult<any>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      this.prisma.workspace.count({ where }),
      this.prisma.workspace.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          _count: { select: { projects: true, members: true } },
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
    const ws = await this.prisma.workspace.findFirst({
      where: { id, deletedAt: null },
      include: {
        projects: true,
        members: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    });
    if (!ws) throw new NotFoundException(`Workspace with ID ${id} not found`);
    return ws;
  }

  async update(id: string, dto: UpdateWorkspaceDto) {
    await this.findOne(id);
    return this.prisma.workspace.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.workspace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true, message: 'Workspace deleted' };
  }
}
