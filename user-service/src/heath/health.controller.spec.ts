import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../app.module';

describe('HealthController (Integration)', () => {
  let app: INestApplication;
  let memoryServer: MongoMemoryServer;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    process.env.MONGO_URI = uri;
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

  afterAll(async () => {
    await memoryServer.stop();
  });

  describe('GET /health', () => {
    const expectedResponse = {
      status: 'ok',
      info: {
        mongo: {
          status: 'up',
        },
        rabbitMq: {
          status: 'up',
        },
      },
      error: {},
      details: {
        mongo: {
          status: 'up',
        },
        rabbitMq: {
          status: 'up',
        },
      },
    };

    it('should return health check status', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response.body).toMatchObject(expectedResponse);
    });
  });
});
