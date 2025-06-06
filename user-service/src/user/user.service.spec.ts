import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { MessageBrokerService } from '../message-broker/message-broker.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Types } from 'mongoose';
import { UserDocument } from './user.schema';
import { MongoServerError } from 'mongodb';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let messageBrokerService: jest.Mocked<MessageBrokerService>;

  const mockUser = {
    _id: new Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
  } as UserDocument;

  const mockReadUserDto = {
    id: mockUser._id.toString(),
    name: mockUser.name,
    email: mockUser.email,
    createdAt: mockUser.createdAt,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    };

    const mockMessageBrokerService = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: MessageBrokerService,
          useValue: mockMessageBrokerService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    messageBrokerService = module.get(MessageBrokerService);
  });

  describe('createUser', () => {
    it('should create a user and emit an event', async () => {
      const createDto: CreateUserDto = {
        name: 'Dasha',
        email: 'dasha@gmail.com',
      };

      userRepository.create.mockResolvedValue(mockUser);
      messageBrokerService.emit.mockResolvedValue(undefined);

      const result = await service.createUser(createDto);

      expect(userRepository.create).toHaveBeenCalledWith(createDto);
      expect(messageBrokerService.emit).toHaveBeenCalledTimes(1);
      expect(messageBrokerService.emit).toHaveBeenCalledWith('user.created', mockReadUserDto);
      expect(result).toEqual(mockReadUserDto);
    });

    it('should throw MongoServerError when email already exists', async () => {
      const duplicateKeyError = new MongoServerError({
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: 'dasha@gmail.com' },
        message: 'Duplicate key error',
      });
      userRepository.create.mockRejectedValue(duplicateKeyError);

      await expect(service.createUser(mockUser)).rejects.toThrow(MongoServerError);

      expect(messageBrokerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Liza',
      };

      userRepository.update.mockResolvedValue(mockUser);

      const result = await service.updateUser(mockUser._id.toString(), updateDto);

      expect(userRepository.update).toHaveBeenCalledWith(mockUser._id.toString(), updateDto);
      expect(result).toEqual(mockReadUserDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.update.mockResolvedValue(null);

      await expect(service.updateUser('id', { name: 'Liza' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and emit an event', async () => {
      userRepository.delete.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
      messageBrokerService.emit.mockResolvedValue(undefined);

      await service.deleteUser(mockUser._id.toString());

      expect(userRepository.delete).toHaveBeenCalledWith(mockUser._id.toString());
      expect(messageBrokerService.emit).toHaveBeenCalledTimes(1);
      expect(messageBrokerService.emit).toHaveBeenCalledWith('user.deleted', {
        id: mockUser._id.toString(),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.delete.mockResolvedValue({ acknowledged: false, deletedCount: 0 });
      messageBrokerService.emit.mockResolvedValue(undefined);

      await expect(service.deleteUser('id')).rejects.toThrow(NotFoundException);
      expect(messageBrokerService.emit).toHaveBeenCalledTimes(0);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser._id.toString());

      expect(userRepository.findOne).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toEqual(mockReadUserDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockPaginatedResponse = {
        data: [mockUser],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      };

      userRepository.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await service.findAll(1, 10);

      expect(userRepository.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({
        data: [mockReadUserDto],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should throw BadRequestException for invalid page or limit', async () => {
      await expect(service.findAll(0, 10)).rejects.toThrow(BadRequestException);

      await expect(service.findAll(1, 0)).rejects.toThrow(BadRequestException);
    });
  });
});
