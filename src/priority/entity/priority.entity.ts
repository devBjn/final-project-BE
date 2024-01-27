import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Priority {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;
}
