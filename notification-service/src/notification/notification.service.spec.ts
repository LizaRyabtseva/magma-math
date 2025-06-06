import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { Channel } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { UserCreatedDto } from './dto/user-created.dto';
import { UserDeletedDto } from './dto/user-deleted.dto';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockChannel: Partial<Channel>;
  let mockMessage: Partial<ConsumeMessage>;

  const createValidData: UserCreatedDto = {
    id: 'id',
    name: 'Liza',
    email: 'liza@gmail.com',
    createdAt: new Date().toISOString(),
  };

  const createInvalidData = {
    id: 'id',
  };

  const deleteValidData: UserDeletedDto = {
    id: 'id',
  };

  const deleteInvalidData = {};

  beforeEach(async () => {
    mockChannel = {
      ack: jest.fn(),
    };
    mockMessage = {
      content: Buffer.from('{}'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('processUserCreated', () => {
    it('should process valid user created event', async () => {
      await service.processUserCreated(
        createValidData,
        mockChannel as Channel,
        mockMessage as ConsumeMessage,
      );

      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle invalid user created event', async () => {
      await service.processUserCreated(
        createInvalidData,
        mockChannel as Channel,
        mockMessage as ConsumeMessage,
      );

      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('processUserDeleted', () => {
    it('should process valid user deleted event', async () => {
      await service.processUserDeleted(
        deleteValidData,
        mockChannel as Channel,
        mockMessage as ConsumeMessage,
      );

      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle invalid user deleted event', async () => {
      await service.processUserDeleted(
        deleteInvalidData,
        mockChannel as Channel,
        mockMessage as ConsumeMessage,
      );

      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('validateDto', () => {
    it('should validate and return valid DTO', () => {
      const result = (service as any).validateDto(
        UserCreatedDto,
        createValidData,
        mockChannel as Channel,
        mockMessage as ConsumeMessage,
      );

      expect(result).toBeInstanceOf(UserCreatedDto);
      expect(result).toMatchObject(createValidData);
    });

    it('should return null for invalid DTO', () => {
      const result = (service as any).validateDto(
        UserCreatedDto,
        createInvalidData,
        mockChannel as Channel,
        mockMessage as ConsumeMessage,
      );

      expect(result).toBeNull();
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });
  });
});
