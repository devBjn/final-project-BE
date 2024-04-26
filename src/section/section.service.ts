import { Injectable } from '@nestjs/common';
import { DeleteResult, Repository } from 'typeorm';
import { Section } from './entity/section.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSectionRequest } from './dtos/create.section.dto';

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
  ) {}

  private getSectionsBaseQuery() {
    return this.sectionRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.tasks', 'tasks')
      .orderBy('e.id', 'DESC');
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

  public async createSection(input: CreateSectionRequest): Promise<Section> {
    return await this.sectionRepository.save({
      ...input,
    });
  }

  public async updateSection(
    section: Section,
    input: CreateSectionRequest,
  ): Promise<Section> {
    return await this.sectionRepository.save({
      ...section,
      ...input,
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
