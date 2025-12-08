import { Module } from '@nestjs/common';
import { BriefsService } from './briefs.service';
import { BriefsController } from './briefs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BriefsService],
  controllers: [BriefsController],
  exports: [BriefsService],
})
export class BriefsModule {}
