import { IsString } from 'class-validator';

export class CreateSectionRequest {
  @IsString()
  title: string;

  tasks?: string[];
}
