import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../../../packages/database/src/prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
