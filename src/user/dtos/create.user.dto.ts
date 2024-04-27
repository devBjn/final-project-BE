import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserRequest {
  @Length(5)
  @IsNotEmpty()
  username: string;

  @Length(8)
  @IsNotEmpty()
  password: string;

  @Length(8)
  @IsNotEmpty()
  retypedPassword: string;

  @Length(2)
  @IsNotEmpty()
  firstName: string;

  @Length(2)
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class GetUserResponse {
  @IsString()
  id: string;

  @Length(5)
  @IsNotEmpty()
  username: string;

  @Length(2)
  @IsNotEmpty()
  firstName: string;

  @Length(2)
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  token?: string;

  avatar?: string;

  //date of birth
  dob?: string;

  phone?: string;

  address?: string;

  color?: string;
}
