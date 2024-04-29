import { Task } from 'src/task/entity/task.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Priority {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Task, (task) => task.priority, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  tasks: Task[];
}
