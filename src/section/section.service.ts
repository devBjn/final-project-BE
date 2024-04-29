import { Injectable } from '@nestjs/common';
import { DeleteResult, Repository } from 'typeorm';
import { Section } from './entity/section.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSectionRequest } from './dtos/create.section.dto';
import { Task } from 'src/task/entity/task.entity';

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  private getSectionsBaseQuery() {
    return this.sectionRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.tasks', 'tasks');
  }

  public async getAllSections(): Promise<Section[]> {
    return await this.getSectionsBaseQuery().getMany();
  }

  public async getSection(id: number): Promise<Section | undefined> {
    const query = (await this.getSectionsBaseQuery()).andWhere('e.id = :id', {
      id,
    });

    return await query.getOne();
  }

  private async getTaskBaseQuery(
    taskId: string,
    statusId: number,
  ): Promise<Task> {
    const task = await this.taskRepository
      .createQueryBuilder('e')
      .leftJoin('e.createdBy', 'user')
      .leftJoinAndSelect('e.status', 'status')
      .leftJoinAndSelect('e.priority', 'priority')
      .leftJoinAndSelect('e.type', 'type')
      .leftJoin('e.project', 'project')
      .addSelect([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.avatar',
        'user.color',
        'project.id',
      ])
      .andWhere('e.id = :id AND status.id = :statusId', {
        id: taskId,
        statusId,
      })
      .getOne();

    return task;
  }

  public async createSection(input: CreateSectionRequest): Promise<Section> {
    return await this.sectionRepository.save({
      ...input,
      tasks: [],
      taskIds: [],
    });
  }

  public async updateSection(
    section: Section,
    input: CreateSectionRequest,
  ): Promise<Section> {
    let tasks = [];

    if (input.tasks.length) {
      tasks = await Promise.all(
        input.tasks.map(
          async (id: string) => await this.getTaskBaseQuery(id, section.id),
        ),
      );
    }

    const taskIds = tasks.map((task: Task) => task.id);
    return await this.sectionRepository.save({
      ...section,
      ...input,
      tasks,
      taskIds,
    });
  }

  public async deleteSection(id: number): Promise<DeleteResult> {
    return await this.sectionRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
