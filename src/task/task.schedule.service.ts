import { BadRequestException, Injectable } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from './entity/task.entity';
import nodemailer from 'nodemailer';
import { UserService } from 'src/user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from 'src/user/entity/user.entity';
@Injectable()
export class TaskSchedulerService {
  constructor(
    private readonly taskService: TaskService,
    private readonly userService: UserService,
  ) {}

  private async sendNotification(email: string, task: Task) {
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

    const mailOptions = {
      from: 'tambintv1@gmail.com',
      to: email,
      subject: 'Deadline Reminder',
      text: `Reminder: You have a task with the deadline approaching.`,
      html: `
      <p style="font-size: 20px; font-weight: 600">Deadline Reminder</p>
      <p>You have a task "${task.name}" with the deadline approaching. The deadline is ${task.deadline.toLocaleString()}.</p>
    `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw new BadRequestException('Error sending email');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  // @Cron('* * * * * *')
  async handleTaskScheduling() {
    const tasksToNotify: Task[] = await this.taskService.findTasksToSchedule();
    // console.log(tasksToNotify, 'task to notify');
    await Promise.all(
      tasksToNotify.map((task: Task) => {
        task.teamUsers.forEach(async (user: User) => {
          return await this.sendNotification(user.email, task);
        });
      }),
    );
  }
}
