import { Inject, Injectable } from '@nestjs/common';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import { Section } from './entity/section.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSectionRequest } from './dtos/create.section.dto';
import { Task } from 'src/task/entity/task.entity';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
// import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';

@Injectable()
export class SectionService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @Inject('SUBSCRIBERS_SERVICE') private subscribersService: ClientProxy,
    // @Inject('RabbitMQService')
    // private readonly rabbitMQService: RabbitMQService,
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
          async (id: string) => await this.getTaskBaseQuery(id, section?.id),
        ),
      );
    }

    const taskIds = tasks.map((task: Task) => task.id);
    console.log(tasks, 'tasks');
    return await this.sectionRepository.save({
      ...section,
      ...input,
      tasks,
      taskIds,
    });
  }

  @MessagePattern({ cmd: 'update-section' })
  public async updateSectionResponse(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    console.log('queue');
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const { section, input } = data;
    console.log(section, 'section rabbit');

    try {
      await this.updateSection(section, input);
      channel.ack(originalMsg);
    } catch (error) {
      console.error('Error updating section:', error);
      // Optionally handle the error (e.g., log, retry, etc.)
    }
  }

  // public async updateSection(
  //   section: Section,
  //   input: CreateSectionRequest,
  // ): Promise<Section> {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();
  //   console.log('here');
  //   try {
  //     let tasks = [];
  //     if (input.tasks.length) {
  //       tasks = await Promise.all(
  //         input.tasks.map(
  //           async (id: string) => await this.getTaskBaseQuery(id, section?.id),
  //         ),
  //       );
  //     }

  //     const taskIds = tasks.map((task: Task) => task.id);
  //     const sections = await queryRunner.manager.save(Section, {
  //       ...section,
  //       ...input,
  //       tasks,
  //       taskIds,
  //     });
  //     await queryRunner.commitTransaction();
  //     return sections;
  //   } catch (e) {
  //     await queryRunner.rollbackTransaction();
  //     throw e;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  public async deleteSection(id: number): Promise<DeleteResult> {
    return await this.sectionRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
