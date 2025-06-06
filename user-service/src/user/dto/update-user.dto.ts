import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email' })
  email?: string;
}
