import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './controller/section.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from './entity/section.entity';
import { Task } from 'src/task/entity/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Section, Task])],
  providers: [SectionService],
  controllers: [SectionController],
})
export class SectionModule {}
