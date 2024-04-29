/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
import { DeleteResult, Repository } from 'typeorm';
import { Project } from './entity/project.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { SectionService } from 'src/section/section.service';
import { Section } from 'src/section/entity/section.entity';
import {
  CreateProjectRequest,
  GetProjectResponse,
} from './dtos/create.project.dto';
import { AssignUserProjectRequest } from './dtos/assign.user.project.dto';
import {
  InviteUserProjectRequest,
  InviteUserProjectResponse,
} from './dtos/invite.user.project.dto';
import nodemailer from 'nodemailer';
import { GetUserResponse } from 'src/user/dtos/create.user.dto';
import { Task } from 'src/task/entity/task.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly sectionService: SectionService,
    private readonly userService: UserService,
  ) {}

  private getProjectsBaseQuery() {
    return this.projectRepository.createQueryBuilder('e');
  }

  private async mapTeamUsers(data: Array<string>): Promise<GetUserResponse[]> {
    const teamUserPromise: Promise<GetUserResponse>[] = data.map(
      async (user: string) => {
        return await this.userService.getUser(user);
      },
    );

    const teamUsers: GetUserResponse[] = await Promise.all(teamUserPromise);

    return teamUsers;
  }

  private async updateTeamUser(
    project: Project,
    member: GetUserResponse,
    flag: string = '',
  ): Promise<GetUserResponse[]> {
    const updatedTeamUsers: GetUserResponse[] = [...project.teamUsers];
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

  private async getTaskListBaseQuery(projectId: string): Promise<Task[]> {
    return this.taskRepository
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
      .andWhere('project.id = :id', { id: projectId })
      .getMany();
  }

  public async getAllProjects(): Promise<Project[]> {
    const projects = await this.getProjectsBaseQuery()
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
      .getMany();

    const result: Project[] = await Promise.all(
      projects.map(async (project: Project) => {
        const tasks = await this.getTaskListBaseQuery(project.id);
        return {
          ...project,
          tasks,
        };
      }),
    );
    return result;
  }

  public async getProjectDetail(id: string): Promise<Project> {
    const query = await this.getProjectsBaseQuery()
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
      .andWhere('e.id = :id', {
        id,
      });
    const project = await query.getOne();

    if (!project) {
      throw new BadRequestException('Project not found!');
    }

    const sectionsPromises: Promise<Section>[] = project.sections.map(
      async (section: Section) => {
        return await this.sectionService.getSection(section?.id);
      },
    );
    const sections: Section[] = await Promise.all(sectionsPromises);

    const tasks = await this.getTaskListBaseQuery(project.id);

    const res = sections.map((section) => {
      const sectionTasks = tasks.filter(
        (task) => task.status?.id === section.id,
      );
      return {
        ...section,
        tasks: sectionTasks,
      };
    });

    res.forEach((section: Section) => {
      section.tasks.sort((a, b) => {
        const indexA = section.taskIds.indexOf(a.id);
        const indexB = section.taskIds.indexOf(b.id);
        return indexA - indexB;
      });
    });
    return { ...project, sections: res, tasks };
  }

  public async createProject(
    input: CreateProjectRequest,
    user: User,
  ): Promise<GetProjectResponse> {
    const sectionsPromises: Promise<Section>[] = input.sections.map(
      async (sectionId: number) => {
        return await this.sectionService.getSection(sectionId);
      },
    );
    const sections: Section[] = await Promise.all(sectionsPromises);
    const teamUsers = await this.mapTeamUsers([...input.teamUsers]);
    const { password, ...info } = user;
    return await this.projectRepository.save({
      name: input.name,
      description: input.description,
      category: input.category,
      teamUsers,
      sections,
      tasks: [],
      createdBy: info,
    });
  }

  public async updateProject(
    project: Project,
    input: CreateProjectRequest,
    user: User,
  ): Promise<GetProjectResponse> {
    const sectionsPromises: Promise<Section>[] = input.sections.map(
      async (sectionId: number) => {
        return await this.sectionService.getSection(sectionId);
      },
    );
    const sections: Section[] = await Promise.all(sectionsPromises);
    const teamUsers = await this.mapTeamUsers([...input.teamUsers]);
    const { password, ...info } = user;
    const tasks = await this.getTaskListBaseQuery(project.id);

    const res = sections.map((section) => {
      const sectionTasks = tasks.filter(
        (task) => task.status?.id === section.id,
      );
      return {
        ...section,
        tasks: sectionTasks,
      };
    });

    if (project.createdBy.id === user.id) {
      const result = await this.projectRepository.save({
        id: project.id,
        name: input.name,
        description: input.description,
        category: input.category,
        sections: res,
        teamUsers,
        createdBy: user,
      });
      return {
        ...result,
        createdBy: info,
        tasks: project.tasks,
      };
    }

    throw new BadRequestException('You can not edit project!');
  }

  public async deleteProject(
    id: number,
    createdByUserId: string,
  ): Promise<DeleteResult> {
    return await this.projectRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id AND createdBy = :createdByUserId', {
        id,
        createdByUserId,
      })
      .execute();
  }

  public async assignMemberToProject(
    memberId: AssignUserProjectRequest,
    project: Project,
    user: User,
  ): Promise<GetProjectResponse> {
    const member = await this.userService.getUser(memberId.userId);

    const updatedTeamUsers = await this.updateTeamUser(project, member);
    if (project.createdBy.id === user.id) {
      const { password, ...info } = user;
      const result = await this.projectRepository.save({
        id: project.id,
        name: project.name,
        description: project.description,
        category: project.category,
        sections: project.sections,
        teamUsers: updatedTeamUsers,
        createdBy: user,
      });
      return {
        ...result,
        createdBy: info,
        tasks: project.tasks,
      };
    }
    throw new BadRequestException('You can not add member to project!');
  }

  public async removeMemberToProject(
    memberId: AssignUserProjectRequest,
    project: Project,
    user: User,
  ): Promise<GetProjectResponse> {
    const member = await this.userService.getUser(memberId.userId);

    if (!member) {
      throw new BadRequestException('User not found');
    }
    const updatedTeamUsers = await this.updateTeamUser(
      project,
      member,
      'remove',
    );
    if (project.createdBy.id === user.id) {
      const { password, ...info } = user;
      const result = await this.projectRepository.save({
        id: project.id,
        name: project.name,
        description: project.description,
        category: project.category,
        sections: project.sections,
        teamUsers: updatedTeamUsers,
        createdBy: user,
      });
      return {
        ...result,
        createdBy: info,
        tasks: project.tasks,
      };
    }
    throw new BadRequestException('You can not add member to project!');
  }

  public async inviteUser(payload: InviteUserProjectRequest): Promise<boolean> {
    const member = await this.userService.getUserByEmail(payload.email);
    const project = await this.getProjectDetail(payload.projectId);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tambintv1@gmail.com',
        pass: 'vdba tjns zelf koqt',
      },
      port: 587,
      secure: false,
      requireTLS: true,
    });
    // domain?projectId=""&email=""
    const mailOptions = {
      from: 'tambintv1@gmail.com',
      to: member.email,
      subject: 'Invite user to project',
      text: 'New message',
      html: `<div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <p style="font-size: '20px'; font-weight: 600;">Invite you to join ${project.name} project</p>
                <p style="font-size: '16px'">${payload.message}</p>
                <a style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px;" 
                    href="http://localhost:3000/project/accept?email=${member.email}&projectId=${project.id}" 
                    target="_blank"
                >
                  Click here to join
                </a>
            </div>`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      if (info) return true;
    } catch (error) {
      throw new BadRequestException('Error sending email');
    }
  }

  public async acceptInvite(
    payload: InviteUserProjectRequest,
  ): Promise<InviteUserProjectResponse> {
    const member = await this.userService.getUserByEmail(payload.email);
    const project = await this.getProjectDetail(payload.projectId);

    const updatedTeamUsers = await this.updateTeamUser(project, member);
    const updatedProject = await this.projectRepository.save({
      id: project.id,
      name: project.name,
      description: project.description,
      category: project.category,
      sections: project.sections,
      tasks: project.tasks,
      teamUsers: updatedTeamUsers,
      createdBy: project.createdBy,
    });

    return {
      status: true,
    };
  }

  public async getListProjectByUser(user: User) {
    const projects = await this.getProjectsBaseQuery()
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
      .getMany();

    const result: Project[] = await Promise.all(
      projects.map(async (project: Project) => {
        const tasks = await this.getTaskListBaseQuery(project.id);
        return {
          ...project,
          tasks,
        };
      }),
    );
    const list = result.filter(
      (project: Project) =>
        project.createdBy.id === user.id ||
        project.teamUsers.some((member: User) => member.id === user.id),
    );
    return list;
  }
}
