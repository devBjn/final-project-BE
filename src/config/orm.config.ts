import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Comment } from 'src/comment/entity/comment.entity';
import { Priority } from 'src/priority/entity/priority.entity';
import { Project } from 'src/project/entity/project.entity';
import { Section } from 'src/section/entity/section.entity';
import { Task } from 'src/task/entity/task.entity';
import { Time } from 'src/time/entity/time.entity';
import { Type } from 'src/type/entity/type.entity';
import { User } from 'src/user/entity/user.entity';

export default registerAs(
  'orm.config',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Section, Project, Priority, Comment, Task, Time, Type],
    synchronize: false, //change directive DB
  }),
);
