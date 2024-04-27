import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Type } from './entity/type.entity';
import { DeleteResult, Repository } from 'typeorm';
import { CreateTypeRequest } from './dtos/create.type.dto';

@Injectable()
export class TypeService {
  constructor(
    @InjectRepository(Type)
    private readonly typeRepository: Repository<Type>,
  ) {}

  private getTypeBaseQuery() {
    return this.typeRepository.createQueryBuilder('e');
  }

  public async getAllTypes() {
    return await this.getTypeBaseQuery().getMany();
  }

  public async getType(id: number): Promise<Type | undefined> {
    return await this.getTypeBaseQuery()
      .andWhere('e.id = :id', {
        id,
      })
      .getOne();
  }

  public async createType(input: CreateTypeRequest): Promise<Type> {
    return await this.typeRepository.save({
      ...input,
    });
  }

  public async updateType(
    priority: Type,
    input: CreateTypeRequest,
  ): Promise<Type> {
    return await this.typeRepository.save({
      ...priority,
      ...input,
    });
  }

  public async deleteType(id: number): Promise<DeleteResult> {
    return await this.typeRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
