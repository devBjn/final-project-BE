import { Section } from 'src/section/entity/section.entity';
import { Task } from 'src/task/entity/task.entity';
import { User } from 'src/user/entity/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  // ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'longtext' })
  description: string;

  @Column()
  category: string;

  @OneToMany(() => Section, (section) => section.project)
  sections: Section[] | null;

  @Column({ type: 'json', nullable: true })
  sectionsJson: Section[] | null;

  @Column({ type: 'json', nullable: true })
  teamUsers: User[] | null;

  @OneToMany(() => Task, (task) => task.project, { cascade: true })
  tasks?: Task[] | null;

  @Column({ type: 'json', nullable: true })
  tasksJson?: Task[] | null;

  @ManyToOne(() => User, (user) => user.ownerProject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  createdBy?: User;
}
