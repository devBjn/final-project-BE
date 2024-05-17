import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entity/comment.entity';
import { DeleteResult, Repository } from 'typeorm';
import {
  CreateCommentRequest,
  GetCommentResponse,
  UpdateCommentRequest,
} from './dtos/create.comment.dto';
import { User } from 'src/user/entity/user.entity';
import { Task } from 'src/task/entity/task.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  private getCommentsBaseQuery() {
    return this.commentRepository.createQueryBuilder('e');
  }

  private mappedComment(comment: Comment): GetCommentResponse {
    const commentResponse: GetCommentResponse = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      createdBy: comment.createdBy,
      updatedAt: comment.updatedAt,
      ...(comment.task && { taskId: comment.task.id }),
      ...(comment.parent && { parentId: comment.parent.id }),
    };
    if (comment.children && comment.children.length > 0) {
      commentResponse.children = comment.children.map((child) =>
        this.mappedComment(child),
      );
    }

    return commentResponse;
  }

  private async getTaskDetailQuery(id: string) {
    return await this.taskRepository
      .createQueryBuilder('e')
      .leftJoin('e.createdBy', 'user')
      .addSelect([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.avatar',
        'user.color',
      ])
      .leftJoin('e.project', 'project')
      .addSelect(['project.id'])
      .andWhere('e.id = :id', {
        id,
      })
      .getOne();
  }

  public async getAllComments(): Promise<GetCommentResponse[]> {
    const comments = await this.getCommentsBaseQuery()
      .orderBy('e.createdAt', 'ASC')
      .leftJoinAndSelect('e.children', 'children')
      .leftJoinAndSelect('e.parent', 'parent')
      .leftJoin('e.createdBy', 'user')
      .leftJoin('e.task', 'task')
      .addSelect([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.avatar',
        'user.color',
        'task.id',
        'parent.id',
      ])
      .getMany();

    const result = comments.map((comment) => this.mappedComment(comment));
    return result.filter((comment) => !comment.parentId);
  }

  public async getComment(id: string): Promise<GetCommentResponse | undefined> {
    const result = await this.getCommentsBaseQuery()
      .leftJoin('e.createdBy', 'user')
      .leftJoinAndSelect('e.children', 'children')
      .leftJoin('e.task', 'task')
      .addSelect([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.avatar',
        'user.color',
        'task.id',
      ])
      .andWhere('e.id = :id', {
        id,
      })
      .getOne();
    return {
      id: result.id,
      content: result.content,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      createdBy: result.createdBy,
      taskId: result.task.id,
      // children: result.children,
      parentId: result.parent ? result.parent.id : null,
    };
  }

  public async createComment(
    input: CreateCommentRequest,
    user: User,
  ): Promise<GetCommentResponse> {
    const task = await this.getTaskDetailQuery(input.taskId);
    let parentComment = null;
    if (input.parentId) {
      parentComment = await this.commentRepository.findOne({
        where: {
          id: input.parentId,
        },
      });
    }
    const createdComment = await this.commentRepository.save({
      content: input.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      task,
      parent: parentComment ?? null,
      createdBy: user,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...info } = user;
    const comment = {
      id: createdComment.id,
      content: createdComment.content,
      createdAt: createdComment.createdAt,
      updatedAt: createdComment.updatedAt,
      createdBy: info,
      taskId: createdComment.task.id,
      children: [],
      ...(createdComment.parent && { parentId: createdComment.parent.id }),
    };

    const parentCmt = await this.commentRepository.findOne({
      where: {
        id: input.parentId,
      },
    });
    const payload = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      createdBy: comment.createdBy,
      task,
      children: comment.children,
      taskId: comment.taskId,
      ...(comment.parentId && { parent: parentCmt }),
    };
    return this.mappedComment(payload);
  }

  public async updateComment(
    comment: GetCommentResponse,
    input: UpdateCommentRequest,
    user: User,
  ): Promise<GetCommentResponse> {
    const updatedAt = new Date();
    const task = await this.getTaskDetailQuery(comment.taskId);
    if (comment.createdBy.id === user.id) {
      const updatedComment = await this.commentRepository.save({
        id: comment.id,
        content: input.content,
        createdAt: comment.createdAt,
        updatedAt,
        task,
        createdBy: user,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...info } = user;
      return {
        id: updatedComment.id,
        content: updatedComment.content,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
        createdBy: info,
        taskId: updatedComment.task.id,
      };
    }
    throw new BadRequestException('You can not update this comment');
  }

  public async deleteComment(
    id: string,
    createdByUserId: string,
  ): Promise<DeleteResult> {
    return await this.commentRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id AND createdBy = :createdByUserId', {
        id,
        createdByUserId,
      })
      .execute();
  }
}
