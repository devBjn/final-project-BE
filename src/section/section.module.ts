import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './controller/section.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from './entity/section.entity';
import { Task } from 'src/task/entity/task.entity';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Section, Task]),
    ConfigModule,
    RabbitMQModule.registerRmq('SUBSCRIBERS_SERVICE', 'section_queue_test'),
  ],
  providers: [RabbitMQService, SectionService],
  controllers: [SectionController],
  exports: [RabbitMQService, SectionService],
})
export class SectionModule {}
