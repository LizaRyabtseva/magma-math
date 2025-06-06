import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class UserCreatedDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  createdAt: string;
}
