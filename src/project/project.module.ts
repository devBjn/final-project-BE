import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entity/project.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './controllers/project.controller';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entity/user.entity';
import { Section } from 'src/section/entity/section.entity';
import { SectionService } from 'src/section/section.service';
import { Task } from 'src/task/entity/task.entity';
import { MediaService } from 'src/media/media.service';
import { FirebaseService } from 'src/firebase/firebase.image.service';
import { JwtService } from '@nestjs/jwt';
import { SectionModule } from 'src/section/section.module';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, User, Section, Task]),
    SectionModule,
    RabbitMQModule.registerRmq('SUBSCRIBERS_SERVICE', 'section_queue'),
  ],
  providers: [
    ProjectService,
    UserService,
    SectionService,
    MediaService,
    FirebaseService,
    JwtService,
  ],
  controllers: [ProjectController],
})
export class ProjectModule {}
