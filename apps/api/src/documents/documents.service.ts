import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@packages/database/src/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        title: dto.title,
        projectId: dto.projectId,
        url: dto.url,
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
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          _count: { select: { chunks: true } },
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
    const doc = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: { chunks: true },
    });
    if (!doc) throw new NotFoundException(`Document with ID ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true, message: 'Document deleted' };
  }
}
