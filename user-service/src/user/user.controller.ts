import {
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Body,
  Query,
  ParseIntPipe,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReadUserDto } from './dto/read-user.dto';
import { ObjectIdValidationPipe } from '../pipes/object-id-validation.pipe';
import { IPaginatedUsersResponse } from './user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async createUser(@Body() createUserDto: CreateUserDto): Promise<ReadUserDto> {
    return this.userService.createUser(createUserDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  public async updateUser(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ReadUserDto> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteUser(@Param('id', ObjectIdValidationPipe) id: string): Promise<void> {
    await this.userService.deleteUser(id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  public async findOne(@Param('id', ObjectIdValidationPipe) id: string): Promise<ReadUserDto> {
    return this.userService.findOne(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  public async findAll(
    @Query('page', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    page = 1,
    @Query('limit', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    limit = 10,
  ): Promise<IPaginatedUsersResponse> {
    return this.userService.findAll(page, limit);
  }
}
