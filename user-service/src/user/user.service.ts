import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReadUserDto } from './dto/read-user.dto';
import { UserDocument } from './user.schema';
import { IPaginatedUsersResponse } from './user.interface';
import { MessageBrokerService } from '../message-broker/message-broker.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly messageBrokerService: MessageBrokerService,
  ) {}

  private mapToReadDto(user: UserDocument): ReadUserDto {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  public async createUser(createDto: CreateUserDto): Promise<ReadUserDto> {
    const createdUser = await this.userRepository.create(createDto);
    const user = this.mapToReadDto(createdUser);

    await this.messageBrokerService.emit('user.created', user);
    this.logger.log(`[${this.createUser.name}] Created user with id: ${user.id}`);

    return user;
  }

  public async updateUser(id: string, dto: UpdateUserDto): Promise<ReadUserDto> {
    const updatedUser = await this.userRepository.update(id, dto);
    if (!updatedUser) {
      throw new NotFoundException(`User with id=${id} not found`);
    }

    const user = this.mapToReadDto(updatedUser);
    this.logger.log(`[${this.updateUser.name}] Updated user with id: ${id}`);

    return user;
  }

  public async deleteUser(id: string): Promise<void> {
    const deletedResult = await this.userRepository.delete(id);

    if (deletedResult.deletedCount === 0) {
      throw new NotFoundException(`User with id=${id} not found`);
    }

    await this.messageBrokerService.emit('user.deleted', { id });
    this.logger.log(`[${this.deleteUser.name}] Deleted user with id: ${id}`);
  }

  public async findOne(id: string): Promise<ReadUserDto> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with id=${id} not found`);
    }
    this.logger.log(`[${this.findOne.name}] Found user with id: ${id}`);
    return this.mapToReadDto(user);
  }

  public async findAll(page: number, limit: number): Promise<IPaginatedUsersResponse> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit values must be greater than 0');
    }

    const {
      data,
      page: p,
      limit: l,
      total,
      totalPages,
    } = await this.userRepository.findAll(page, limit);
    this.logger.log(`[${this.findAll.name}] Found requested data`);

    return {
      data: data.map(user => this.mapToReadDto(user)),
      page: p,
      limit: l,
      total,
      totalPages,
    };
  }
}
