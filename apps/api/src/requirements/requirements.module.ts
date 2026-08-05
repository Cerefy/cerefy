import { Module } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { RequirementsController } from './requirements.controller';
import { PrismaService } from '../../../packages/database/src/prisma.service';

@Module({
  controllers: [RequirementsController],
  providers: [RequirementsService, PrismaService],
  exports: [RequirementsService],
})
export class RequirementsModule {}
