import { Task } from 'src/task/entity/task.entity';
import { User } from 'src/user/entity/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column()
  createdAt?: Date;

  @Column()
  updatedAt?: Date;

  @ManyToOne(() => Task, (task) => task.comments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'task' })
  task?: Task;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  createdBy?: User;

  @ManyToOne(() => Comment, (parent) => parent.children, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  parent?: Comment | null;

  @OneToMany(() => Comment, (child) => child.parent, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  children?: Comment[];
}
