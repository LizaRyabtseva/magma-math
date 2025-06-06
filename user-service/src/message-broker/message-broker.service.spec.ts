import { Test, TestingModule } from '@nestjs/testing';
import { MessageBrokerService } from './message-broker.service';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { Types } from 'mongoose';
import { UserDocument } from '../user/user.schema';

describe('MessageBrokerService', () => {
  let service: MessageBrokerService;
  let client: jest.Mocked<ClientProxy>;

  const mockUser = {
    _id: new Types.ObjectId(),
    name: 'Liza',
    email: 'liza@gmail..com',
    createdAt: new Date(),
  } as UserDocument;

  beforeEach(async () => {
    const mockClient = {
      connect: jest.fn(),
      close: jest.fn(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageBrokerService,
        {
          provide: 'MESSAGE_BROKER_CLIENT',
          useValue: mockClient,
        },
      ],
    }).compile();

    service = module.get<MessageBrokerService>(MessageBrokerService);
    client = module.get('MESSAGE_BROKER_CLIENT');
  });

  describe('onModuleInit', () => {
    it('should connect to RabbitMQ', async () => {
      client.connect.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(client.connect).toHaveBeenCalled();
    });

    it('should throw error when connection fails', async () => {
      const error = new Error('Connection failed');
      client.connect.mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow(error);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close RabbitMQ connection', async () => {
      client.close.mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(client.close).toHaveBeenCalled();
    });

    it('should throw error when closing connection fails', async () => {
      const error = new Error('Close failed');
      client.close.mockRejectedValue(error);

      await expect(service.onModuleDestroy()).rejects.toThrow(error);
    });
  });

  describe('emit', () => {
    it('should emit event', async () => {
      const pattern = 'user.created';
      client.emit.mockReturnValue(of(undefined));

      await service.emit(pattern, mockUser);

      expect(client.emit).toHaveBeenCalledWith(pattern, mockUser);
    });

    it('should throw error when event fails', async () => {
      const pattern = 'user.created';

      const error = new Error('Emission failed');
      client.emit.mockReturnValue(throwError(() => error));

      await expect(service.emit(pattern, mockUser)).rejects.toThrow(error);
    });
  });
});
