import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginUserRequest {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @Length(8)
  @IsNotEmpty()
  password: string;
}
