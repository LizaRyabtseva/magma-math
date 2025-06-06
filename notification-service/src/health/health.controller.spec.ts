import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('HealthController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.BROKER_URI = 'amqp://localhost';
    process.env.QUEUE_NAME = 'test-queue';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    const expectedResponse = {
      status: 'ok',
      info: {
        rabbitmq: {
          status: 'up',
        },
      },
      error: {},
      details: {
        rabbitmq: {
          status: 'up',
        },
      },
    };

    it('should return health check status', async () => {
      const { body } = await request(app.getHttpServer()).get('/health').expect(200);

      expect(body).toMatchObject(expectedResponse);
    });
  });
});
