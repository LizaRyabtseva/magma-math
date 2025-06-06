import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { UserCreatedDto } from './dto/user-created.dto';
import { UserDeletedDto } from './dto/user-deleted.dto';
import { firstValueFrom } from 'rxjs';

describe('NotificationController (Integration)', () => {
  let app: INestApplication;
  let client: ClientProxy;

  const RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
  const TEST_QUEUE = 'test_queue';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        NotificationModule,
        ClientsModule.register([
          {
            name: 'RABBITMQ_SERVICE',
            transport: Transport.RMQ,
            options: {
              urls: [RABBITMQ_URL],
              queue: TEST_QUEUE,
              queueOptions: {
                durable: true,
              },
            },
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3001);

    try {
      client = app.get('RABBITMQ_SERVICE');
      await client.connect();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error.message);
      throw new Error(
        `Failed to connect to RabbitMQ at ${RABBITMQ_URL}. ` +
          'Please ensure RabbitMQ is running and accessible.',
      );
    }
  });

  afterAll(async () => {
    try {
      await client?.close();
      await app?.close();
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  });

  describe('User Events', () => {
    it('should handle user.created event', async () => {
      const userData: UserCreatedDto = {
        id: 'id',
        name: 'Liza',
        email: 'liza@gmail.com',
        createdAt: new Date().toISOString(),
      };

      try {
        await firstValueFrom(client.emit('user.created', userData));
      } catch (error) {
        console.error('Error emitting user.created event:', error);
        throw error;
      }
    });

    it('should handle user.deleted event', async () => {
      const userData: UserDeletedDto = {
        id: 'id',
      };

      try {
        await firstValueFrom(client.emit('user.deleted', userData));
      } catch (error) {
        console.error('Error emitting user.deleted event:', error);
        throw error;
      }
    });

    it('should handle invalid user.created event', async () => {
      const invalidData = {
        id: 'id',
      };

      try {
        await firstValueFrom(client.emit('user.created', invalidData));
      } catch (error) {
        console.error('Error emitting invalid user.created event:', error);
        throw error;
      }
    });
  });
});
