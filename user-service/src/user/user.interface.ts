import { UserDocument } from './user.schema';
import { ReadUserDto } from './dto/read-user.dto';

export interface IPaginatedUsers {
  data: UserDocument[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedUsersResponse {
  data: ReadUserDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
