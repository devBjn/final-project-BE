import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SectionService } from '../section.service';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateSectionRequest } from '../dtos/create.section.dto';
import { Section } from '../entity/section.entity';
import { DeleteResult } from 'typeorm';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AuthGuardJwt } from 'src/auth/auth-guard.jwt';

@ApiTags('Section')
@Controller('/sections')
export class SectionController {
  constructor(
    private readonly sectionService: SectionService,
    @Inject('SUBSCRIBERS_SERVICE') private subscribersService: ClientProxy,
  ) {}

  @Get('getAll')
  async findAll(): Promise<Section[]> {
    return await this.sectionService.getAllSections();
  }

  @Post('create')
  async create(@Body() input: CreateSectionRequest): Promise<Section> {
    return await this.sectionService.createSection(input);
  }

  @Patch('update/:id')
  @ApiParam({
    name: 'id',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(@Param('id') id, @Body() input: CreateSectionRequest) {
    const section = await this.sectionService.getSection(id);
    if (!section) {
      throw new NotFoundException();
    }

    try {
      return await this.subscribersService.emit(
        { cmd: 'update-section' },
        {
          id: section.id,
          section,
          input,
        },
      );
    } catch (error) {
      console.error('Error sending update-section message:', error);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'update-section' })
  public async updateSectionResponse(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    console.log('run queue');
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const { section, input } = data;
    try {
      await this.sectionService.updateSection(section, input);
      channel.ack(originalMsg);
    } catch (error) {
      console.error('Error updating section:', error);
    }
  }

  @Delete('remove/:id')
  @ApiParam({
    name: 'id',
  })
  @HttpCode(204)
  async remove(@Param('id') id): Promise<DeleteResult> {
    const section = await this.sectionService.getSection(id);

    if (!section) {
      throw new NotFoundException();
    }

    return await this.sectionService.deleteSection(id);
  }
}
