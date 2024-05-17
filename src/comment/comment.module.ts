import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entity/comment.entity';
import { CommentController } from './controller/comment.controller';
import { CommentService } from './comment.service';
import { Task } from 'src/task/entity/task.entity';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { Section } from 'src/section/entity/section.entity';
import { Type } from 'src/type/entity/type.entity';
import { Priority } from 'src/priority/entity/priority.entity';
import { SectionService } from 'src/section/section.service';
import { TypeService } from 'src/type/type.service';
import { PriorityService } from 'src/priority/priority.service';
import { Project } from 'src/project/entity/project.entity';
import { ProjectService } from 'src/project/project.service';
import { MediaService } from 'src/media/media.service';
import { FirebaseService } from 'src/firebase/firebase.image.service';
import { JwtService } from '@nestjs/jwt';
import { SectionModule } from 'src/section/section.module';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment,
      Task,
      User,
      Section,
      Type,
      Priority,
      Project,
    ]),
    SectionModule,
    RabbitMQModule.registerRmq('SUBSCRIBERS_SERVICE', 'main_queue'),
  ],
  controllers: [CommentController],
  providers: [
    CommentService,
    UserService,
    SectionService,
    TypeService,
    PriorityService,
    ProjectService,
    MediaService,
    FirebaseService,
    JwtService,
  ],
})
export class CommentModule {}
