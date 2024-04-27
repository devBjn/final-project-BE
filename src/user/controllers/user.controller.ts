import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../user.service';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetUserResponse } from '../dtos/create.user.dto';
import { AuthGuardJwt } from 'src/auth/auth-guard.jwt';
import { UpdateUserRequest } from '../dtos/update.user.dto';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '../entity/user.entity';
import { CurrentUser } from 'src/auth/current-user.decorator';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('getAll')
  async findAll(): Promise<GetUserResponse[]> {
    return await this.userService.getAllUsers();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
  })
  async getUserDetail(@Param('id') id): Promise<GetUserResponse> {
    return await this.userService.getUser(id);
  }

  @Get('username/:username')
  @ApiParam({
    name: 'username',
  })
  async getUserByUsername(
    @Param('username') username,
  ): Promise<GetUserResponse> {
    return await this.userService.getUserByUsername(username);
  }

  @Get('detail/information')
  @ApiBearerAuth()
  @UseGuards(AuthGuardJwt)
  async getUserByToken(
    @CurrentUser() user: User,
  ): Promise<GetUserResponse | User> {
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
      color: user.color,
    };
  }

  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(AuthGuardJwt)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
  })
  async update(
    @Param('id') id,
    @UploadedFile()
    image: Express.Multer.File,
    @Body() input: UpdateUserRequest,
  ): Promise<GetUserResponse> {
    return await this.userService.updateUser(id, image, input);
  }
}
