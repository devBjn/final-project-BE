import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GetUserResponse } from './dtos/create.user.dto';
import { MediaService } from 'src/media/media.service';
import { UpdateUserRequest } from './dtos/update.user.dto';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mediaService: MediaService,
    private readonly jwtService: JwtService,
  ) {}

  private getUsersBaseQuery() {
    return this.userRepository.createQueryBuilder('e');
  }

  private async checkExistUser(id: string): Promise<User> {
    const user = await this.getUsersBaseQuery()
      .andWhere('e.id = :id', { id })
      .getOne();

    if (!user) {
      throw new BadRequestException('User not found!');
    }
    return user;
  }

  public async getAllUsers(): Promise<GetUserResponse[]> {
    const userList = await this.getUsersBaseQuery().getMany();
    return userList.map((user) => {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        color: user.color,
      };
    });
  }

  public async getUser(id: string): Promise<GetUserResponse | undefined> {
    const user = await this.checkExistUser(id);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dob: user.dob,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
    };
  }

  public async getUserByToken(
    token: string,
  ): Promise<GetUserResponse | undefined> {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.AUTH_SECRET,
    });
    return await this.getUser(payload.sub);
  }

  public async getUserByUsername(
    username: string,
  ): Promise<GetUserResponse | undefined> {
    const user = await this.userRepository.findOne({
      where: {
        username,
      },
    });
    if (!user) {
      throw new BadRequestException('User not found!');
    }

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.username,
      dob: user.dob,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
    };
  }

  public async getUserByEmail(
    email: string,
  ): Promise<GetUserResponse | undefined> {
    const user = await this.getUsersBaseQuery()
      .andWhere('e.email = :email', {
        email,
      })
      .getOne();
    if (!user) {
      throw new BadRequestException('User not found!');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  public async updateUser(
    id: string,
    image: Express.Multer.File,
    input: UpdateUserRequest,
  ): Promise<GetUserResponse> {
    const user = await this.checkExistUser(id);

    if (image) {
      const imageUrl = await this.mediaService.upload(image);

      input.avatar = imageUrl;
    }
    return await this.userRepository.save({
      id: user.id,
      username: user.username,
      password: user.password,
      firstName: input.firstName,
      lastName: input.lastName,
      email: user.username,
      ...(image && { avatar: input.avatar }),
      dob: input.dob,
      address: input.address,
      phone: input.phone,
    });
  }
}
