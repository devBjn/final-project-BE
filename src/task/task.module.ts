import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entity/task.entity';
import { TaskController } from './controller/task.controller';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entity/user.entity';
import { Section } from 'src/section/entity/section.entity';
import { SectionService } from 'src/section/section.service';
import { TypeService } from 'src/type/type.service';
import { Type } from 'src/type/entity/type.entity';
import { Priority } from 'src/priority/entity/priority.entity';
import { PriorityService } from 'src/priority/priority.service';
import { Project } from 'src/project/entity/project.entity';
import { ProjectService } from 'src/project/project.service';
import { Comment } from 'src/comment/entity/comment.entity';
import { MediaService } from 'src/media/media.service';
import { FirebaseService } from 'src/firebase/firebase.image.service';
import { TaskSchedulerService } from './task.schedule.service';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';
import { SectionModule } from 'src/section/section.module';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      User,
      Section,
      Type,
      Priority,
      Project,
      Comment,
    ]),
    ScheduleModule.forRoot(),
    SectionModule,
    RabbitMQModule.registerRmq('SUBSCRIBERS_SERVICE', 'main_queue'),
  ],
  providers: [
    TaskService,
    UserService,
    SectionService,
    TypeService,
    PriorityService,
    ProjectService,
    MediaService,
    FirebaseService,
    TaskSchedulerService,
    JwtService,
  ],
  controllers: [TaskController],
})
export class TaskModule {}
