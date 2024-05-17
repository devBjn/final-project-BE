import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './controller/section.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from './entity/section.entity';
import { Task } from 'src/task/entity/task.entity';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Section, Task]),
    ConfigModule,
    RabbitMQModule.registerRmq('SUBSCRIBERS_SERVICE', 'main_queue'),
  ],
  providers: [SectionService],
  controllers: [SectionController],
  exports: [SectionService],
})
export class SectionModule {}
