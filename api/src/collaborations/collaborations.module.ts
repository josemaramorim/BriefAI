import { Module } from '@nestjs/common';
import { CollaborationsService } from './collaborations.service';
import { CollaborationsController, CommentsController } from './collaborations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CollaborationsService],
  controllers: [CollaborationsController, CommentsController],
  exports: [CollaborationsService],
})
export class CollaborationsModule {}
