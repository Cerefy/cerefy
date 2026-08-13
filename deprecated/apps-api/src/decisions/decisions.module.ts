import { Module } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { DecisionsController } from './decisions.controller';
import { PrismaService } from '../../../../packages/database/src/prisma.service';

@Module({
  controllers: [DecisionsController],
  providers: [DecisionsService, PrismaService],
  exports: [DecisionsService],
})
export class DecisionsModule {}
