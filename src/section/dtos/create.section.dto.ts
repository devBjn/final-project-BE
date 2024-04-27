import { IsString } from 'class-validator';
import { Task } from 'src/task/entity/task.entity';

export class CreateSectionRequest {
  @IsString()
  title: string;

  tasks?: string[];
}

export class GetSectionResponse {
  id: number;

  title: string;

  tasks?: Task[];
}