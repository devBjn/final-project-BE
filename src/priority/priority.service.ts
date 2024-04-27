import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Priority } from './entity/priority.entity';
import { DeleteResult, Repository } from 'typeorm';
import { CreatePriorityRequest } from './dtos/create.priority.dto';

@Injectable()
export class PriorityService {
  constructor(
    @InjectRepository(Priority)
    private readonly priorityRepository: Repository<Priority>,
  ) {}

  private getPriorityBaseQuery() {
    return this.priorityRepository.createQueryBuilder('e');
  }

  public async getAllPriorities() {
    return await this.getPriorityBaseQuery().getMany();
  }

  public async getPriority(id: number): Promise<Priority | undefined> {
    return await this.getPriorityBaseQuery()
      .andWhere('e.id = :id', {
        id,
      })
      .getOne();
  }

  public async createPriority(input: CreatePriorityRequest): Promise<Priority> {
    return await this.priorityRepository.save({
      ...input,
    });
  }

  public async updatePriority(
    priority: Priority,
    input: CreatePriorityRequest,
  ): Promise<Priority> {
    return await this.priorityRepository.save({
      ...priority,
      ...input,
    });
  }

  public async deletePriority(id: number): Promise<DeleteResult> {
    return await this.priorityRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
