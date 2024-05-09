import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Section } from 'src/section/entity/section.entity';
import { Task } from 'src/task/entity/task.entity';
import { GetUserResponse } from 'src/user/dtos/create.user.dto';

export class CreateProjectRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsArray()
  sections: number[];

  @IsNotEmpty()
  teamUsers: string[];
}

export class GetProjectResponse {
  id: string;

  name: string;

  description: string;

  category: string;

  sectionsJson: Array<Section>;

  teamUsers: Array<GetUserResponse>;

  tasks?: Array<Task>;

  createdBy: GetUserResponse;
}
