import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Name must be a string' })
  @Length(1, 50)
  name: string;

  @IsEmail({}, { message: 'Email must be a valid email' })
  email: string;
}
