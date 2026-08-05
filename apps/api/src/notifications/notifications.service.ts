import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@packages/database/src/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId,
        type: dto.type,
        payload: dto.payload || {},
      },
    });
  }

  async findAll(query: PaginationQueryDto, recipientId: string): Promise<PaginatedResult<any>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { recipientId };

    const [total, data] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

  async markAsRead(id: string, recipientId: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, recipientId },
    });
    if (!notif) throw new NotFoundException(`Notification not found`);

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}
