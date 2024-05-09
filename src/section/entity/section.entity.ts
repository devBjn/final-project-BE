import { Project } from 'src/project/entity/project.entity';
import { Task } from 'src/task/entity/task.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Section {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @ManyToOne(() => Project, (project) => project.sections, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  // @OneToMany(() => Task, (task) => task.status)
  // @Column({ type: 'json', nullable: true })
  // tasks: Task[];

  // @OneToMany(() => Task, (task) => task.status)
  @JoinColumn({ name: 'taskIds' })
  @Column({
    type: 'simple-array',
    nullable: true,
  })
  taskIds: string[];

  @OneToMany(() => Task, (task) => task.status, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  tasks: Task[];
}
