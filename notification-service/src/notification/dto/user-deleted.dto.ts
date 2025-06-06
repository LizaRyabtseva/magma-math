import { IsNotEmpty, IsString } from 'class-validator';

export class UserDeletedDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
