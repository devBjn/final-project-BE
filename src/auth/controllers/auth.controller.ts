import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { CurrentUser } from '../current-user.decorator';
import { User } from 'src/user/entity/user.entity';
import { AuthGuardLocal } from '../auth-guard.local';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CodeAuthRequest } from '../dtos/code.auth.dto';
import { LoginUserRequest } from 'src/user/dtos/login.user.dto';
import {
  CreateUserRequest,
  GetUserResponse,
} from 'src/user/dtos/create.user.dto';
import { EmailUserRequest } from 'src/user/dtos/email.user.dto';
import { PasswordUserRequest } from 'src/user/dtos/password.user.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('login')
  @UseGuards(AuthGuardLocal)
  async login(
    @CurrentUser() user: User,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() loginUserRequest: LoginUserRequest,
  ) {
    const userInfo: GetUserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    return {
      user: userInfo,
      token: this.authService.getTokenForUser(user),
    };
  }

  @Post('createUser')
  async createUser(
    @Body() createUserRequest: CreateUserRequest,
  ): Promise<GetUserResponse> {
    const user = new User();

    if (createUserRequest.password !== createUserRequest.retypedPassword) {
      throw new BadRequestException('Re-password is not the same as password!');
    }

    const existingUser = await this.userRepository.findOne({
      where: [
        { username: createUserRequest.username },
        { email: createUserRequest.email },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('Username or Email is existed!');
    }

    user.username = createUserRequest.username;
    user.password = await this.authService.hashPassword(
      createUserRequest.password,
    );
    user.email = createUserRequest.email;
    user.firstName = createUserRequest.firstName;
    user.lastName = createUserRequest.lastName;

    const color: string =
      '#' + Math.floor(Math.random() * 16777215).toString(16);

    user.color = color;
    const savedUser = await this.userRepository.save(user);
    const token = this.authService.getTokenForUser(user);

    return {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      color: savedUser.color,
      token,
    };
  }

  @Post('sendCode')
  async sendCodeResetPassword(@Body() payload: EmailUserRequest) {
    return await this.authService.sendCodeResetPassword(payload.email);
  }

  @Post('checkCode')
  checkCode(@Body() payload: CodeAuthRequest) {
    return this.authService.checkCode(payload.code);
  }

  @Post('resetPassword')
  async resetPassword(@Body() { password, rePassword }: PasswordUserRequest) {
    if (password !== rePassword)
      throw new BadRequestException('Re-password is not same !');

    const hashPass = await this.authService.hashPassword(password);

    return this.authService.resetPassword(hashPass);
  }
}
