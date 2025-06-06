import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { RmqContext } from '@nestjs/microservices';
import { Channel } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { UserCreatedDto } from './dto/user-created.dto';
import { UserDeletedDto } from './dto/user-deleted.dto';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;
  let mockChannel: Partial<Channel>;
  let mockMessage: Partial<ConsumeMessage>;

  const createValidData: UserCreatedDto = {
    id: 'id',
    name: 'Liza',
    email: 'liza@gmail.com',
    createdAt: new Date().toISOString(),
  };

  const deleteValidData: UserDeletedDto = {
    id: 'id',
  };

  const createMockContext = () => {
    const context = new RmqContext([
      mockMessage as ConsumeMessage,
      mockChannel as Channel,
      'user.created',
    ]);
    jest.spyOn(context, 'getChannelRef').mockReturnValue(mockChannel as Channel);
    jest.spyOn(context, 'getMessage').mockReturnValue(mockMessage as ConsumeMessage);
    return context;
  };

  beforeEach(async () => {
    mockChannel = {
      ack: jest.fn(),
    };
    mockMessage = {
      content: Buffer.from('{}'),
    };

    const mockService = {
      processUserCreated: jest.fn(),
      processUserDeleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  describe('handleUserCreated', () => {
    it('should delegate to service processUserCreated', async () => {
      const mockContext = createMockContext();

      await controller.handleUserCreated(createValidData, mockContext);

      expect(service.processUserCreated).toHaveBeenCalledWith(
        createValidData,
        mockChannel,
        mockMessage,
      );
    });
  });

  describe('handleUserDeleted', () => {
    it('should delegate to service processUserDeleted', async () => {
      const mockContext = createMockContext();

      await controller.handleUserDeleted(deleteValidData, mockContext);

      expect(service.processUserDeleted).toHaveBeenCalledWith(
        deleteValidData,
        mockChannel,
        mockMessage,
      );
    });
  });
});
