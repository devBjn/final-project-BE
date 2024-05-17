import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entity/task.entity';
import { DeleteResult, Repository } from 'typeorm';
import { CreateTaskRequest, GetTaskResponse } from './dtos/create.task.dto';
import { User } from 'src/user/entity/user.entity';
import { GetUserResponse } from 'src/user/dtos/create.user.dto';
import { UserService } from 'src/user/user.service';
import { SectionService } from 'src/section/section.service';
import { PriorityService } from 'src/priority/priority.service';
import { TypeService } from 'src/type/type.service';
import { GetTimeResponse } from 'src/time/dtos/create.time.dto';
import { ProjectService } from 'src/project/project.service';
import { AssignUserProjectRequest } from 'src/project/dtos/assign.user.project.dto';
import { Comment } from 'src/comment/entity/comment.entity';
import { UpdateTaskRequest } from './dtos/update.task.dto';
import { GetCommentResponse } from 'src/comment/dtos/create.comment.dto';
import { formatDate } from 'src/utils/formatDate';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly userService: UserService,
    private readonly sectionService: SectionService,
    private readonly priorityService: PriorityService,
    private readonly typeService: TypeService,
    private readonly projectService: ProjectService,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  private getTasksBaseQuery() {
    return this.taskRepository.createQueryBuilder('e');
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

  private async getAllCommentByTask(id: string): Promise<Comment[]> {
    return await this.commentRepository
      .createQueryBuilder('e')
      .orderBy('e.createdAt', 'ASC')
      .leftJoin('e.createdBy', 'user')
      .leftJoinAndSelect('e.children', 'children')
      .leftJoin('children.createdBy', 'childCreatedBy')
      .leftJoinAndSelect('e.parent', 'parent')
      .addSelect([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.avatar',
        'user.color',
      ])
      .addSelect([
        'childCreatedBy.id',
        'childCreatedBy.username',
        'childCreatedBy.email',
        'childCreatedBy.firstName',
        'childCreatedBy.lastName',
        'childCreatedBy.avatar',
        'childCreatedBy.color',
      ])
      .leftJoin('e.task', 'task')
      .andWhere('task.id = :id', { id })
      .getMany();
  }

  private async mapTeamUsers(data: string[]): Promise<GetUserResponse[]> {
    const teamUserPromise: Promise<GetUserResponse>[] = data.map(
      async (user: string) => {
        return await this.userService.getUser(user);
      },
    );

    const teamUsers: GetUserResponse[] = await Promise.all(teamUserPromise);

    return teamUsers;
  }

  private async updateTeamUser(
    task: GetTaskResponse,
    member: GetUserResponse,
    flag: string = '',
  ): Promise<GetUserResponse[]> {
    const updatedTeamUsers: GetUserResponse[] = [...task.teamUsers];
    if (!flag) {
      if (
        !updatedTeamUsers.some(
          (existingMember: User) => existingMember.id === member.id,
        )
      ) {
        updatedTeamUsers.push(member);
      }

      const teamUsers = await this.mapTeamUsers(
        updatedTeamUsers.map((user) => user.id),
      );
      return teamUsers;
    } else {
      if (
        updatedTeamUsers.some(
          (existingMember: User) => existingMember.id === member.id,
        )
      ) {
        return updatedTeamUsers.filter((user: User) => user.id !== member.id);
      } else {
        throw new BadRequestException('Member is not founded in project!');
      }
    }
  }

  public async getAllTasks(): Promise<Task[]> {
    const tasks = await this.getTasksBaseQuery()
      .leftJoin('e.createdBy', 'user')
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
      .getMany();

    const result: Task[] = await Promise.all(
      tasks.map(async (task: Task) => {
        const commentList = await this.getAllCommentByTask(task.id);
        const commentsMapped = commentList.map((comment) =>
          this.mappedComment(comment),
        );
        const comments = commentsMapped.filter((comment) => !comment.parentId);
        return {
          ...task,
          comments,
        };
      }),
    );
    return result;
  }

  public async getTaskDetail(id: string): Promise<GetTaskResponse> {
    const query = this.getTasksBaseQuery()
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
      .andWhere('e.id = :id', {
        id,
      });
    const task = await query.getOne();

    if (!task) throw new BadRequestException('Task not found!');

    const commentList = await this.getAllCommentByTask(task.id);
    const commentsMapped = commentList.map((comment) => {
      return this.mappedComment(comment);
    });
    const comments = commentsMapped.filter((comment) => !comment.parentId);
    // delete task.project;
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      time: task.time,
      timeCreated: task.timeCreated,
      deadline: task.deadline,
      teamUsers: task.teamUsers,
      comments,
      projectId: task.project.id,
    };
  }

  public async createTask(
    input: CreateTaskRequest,
    user: User,
  ): Promise<GetTaskResponse> {
    const teamUsers = await this.mapTeamUsers([...input.teamUsers]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userInfo } = user;
    const [status, priority, type, project] = await Promise.all([
      this.sectionService.getSection(input.statusId),
      this.priorityService.getPriority(input.priorityId),
      this.typeService.getType(input.typeId),
      this.projectService.getProjectDetail(input.projectId),
    ]);

    const time: GetTimeResponse = {
      originalTime: input.originalTime,
      estimateTime: input.estimateTime,
    };

    const task = await this.taskRepository.save({
      name: input.name,
      description: input.description,
      status,
      priority,
      type,
      time,
      deadline: input.deadline,
      teamUsers,
      comments: [],
      project,
      timeCreated: new Date(),
      createdBy: userInfo,
    });
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      time: task.time,
      timeCreated: task.timeCreated,
      deadline: task.deadline,
      teamUsers: task.teamUsers,
      projectId: project.id,
      createdBy: userInfo,
    };
  }

  public async updateTask(
    task: GetTaskResponse,
    input: UpdateTaskRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user: User,
  ): Promise<GetTaskResponse> {
    const teamUsers = await this.mapTeamUsers([...input.teamUsers]);
    const [status, priority, type, project] = await Promise.all([
      this.sectionService.getSection(input.statusId),
      this.priorityService.getPriority(input.priorityId),
      this.typeService.getType(input.typeId),
      this.projectService.getProjectDetail(task.projectId),
    ]);

    const time: GetTimeResponse = {
      originalTime: input.originalTime,
      estimateTime: input.estimateTime,
    };

    const updatedTask = await this.taskRepository.save({
      id: task.id,
      name: input.name,
      description: input.description,
      status,
      priority,
      type,
      time,
      deadline: input.deadline,
      teamUsers,
      project,
    });

    return {
      id: updatedTask.id,
      name: updatedTask.name,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      type: updatedTask.type,
      time: updatedTask.time,
      timeCreated: task.timeCreated,
      deadline: updatedTask.deadline,
      teamUsers: updatedTask.teamUsers,
      projectId: project.id,
    };
  }

  public async assignMemberToTask(
    memberId: AssignUserProjectRequest,
    task: GetTaskResponse,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user: User,
  ): Promise<GetTaskResponse> {
    const member = await this.userService.getUser(memberId.userId);
    const [updatedTeamUsers, project] = await Promise.all([
      this.updateTeamUser(task, member),
      this.projectService.getProjectDetail(task.projectId),
    ]);
    const {
      id,
      name,
      description,
      status,
      priority,
      type,
      time,
      teamUsers,
      deadline,
      timeCreated,
    } = await this.taskRepository.save({
      id: task.id,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      time: task.time,
      timeCreated: task.timeCreated,
      deadline: task.deadline,
      project,
      teamUsers: updatedTeamUsers,
    });
    return {
      id,
      name,
      description,
      status,
      priority,
      type,
      time,
      deadline,
      teamUsers,
      timeCreated,
      projectId: task.id,
    };
  }

  public async removeMemberToTask(
    memberId: AssignUserProjectRequest,
    task: GetTaskResponse,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user: User,
  ): Promise<GetTaskResponse> {
    const member = await this.userService.getUser(memberId.userId);
    const [updatedTeamUsers, project] = await Promise.all([
      this.updateTeamUser(task, member, 'remove'),
      this.projectService.getProjectDetail(task.projectId),
    ]);
    const {
      id,
      name,
      description,
      status,
      priority,
      type,
      time,
      teamUsers,
      deadline,
      timeCreated,
    } = await this.taskRepository.save({
      id: task.id,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      time: task.time,
      deadline: task.deadline,
      timeCreated: task.timeCreated,
      project,
      teamUsers: updatedTeamUsers,
    });
    return {
      id,
      name,
      description,
      status,
      priority,
      type,
      time,
      deadline,
      timeCreated,
      teamUsers,
      projectId: task.projectId,
    };
  }

  public async deleteTask(id: string): Promise<DeleteResult> {
    return await this.taskRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id', { id })
      .execute();
  }

  async findTasksToSchedule(): Promise<Task[]> {
    const currentTime = new Date();

    const notificationThreshold = new Date(currentTime);
    notificationThreshold.setDate(currentTime.getDate() + 1);
    const deadline = formatDate(notificationThreshold);

    const tasksToNotify = await this.taskRepository
      .createQueryBuilder('e')
      .where('e.deadline = :deadline', {
        deadline,
      })
      .getMany();
    return tasksToNotify;
  }
}
