import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../app.module';
import { MongoExceptionFilter } from '../filters/mongo-exception.filter';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';
import { Types } from 'mongoose';

describe('UserController (Integration)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGO_URI = uri;
    process.env.BROKER_URI = 'amqp://localhost';
    process.env.QUEUE_NAME = 'test-queue';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter(), new MongoExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await mongod.stop();
  });

  describe('POST /users', () => {
    const createUserDto = {
      name: 'Dasha',
      email: 'dasha@gmail.com',
    };

    it('should create a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: createUserDto.name,
        email: createUserDto.email,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = {
        name: '',
        email: 'invalid-email',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('PATCH /users/:id', () => {
    let userId: string;
    let createUserDto: { name: string; email: string };
    const updateUserDto = {
      name: 'Updated Name',
    };

    beforeEach(async () => {
      createUserDto = {
        name: 'Liza',
        email: `liza${Date.now()}@gmail.com`,
      };
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      userId = response.body.id;
    });

    it('should update a user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send(updateUserDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        name: updateUserDto.name,
        email: createUserDto.email,
        createdAt: expect.any(String),
      });
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      await request(app.getHttpServer())
        .patch(`/users/${nonExistentId}`)
        .send(updateUserDto)
        .expect(404);
    });

    it('should return 400 for invalid id format', async () => {
      await request(app.getHttpServer()).patch('/users/invalid-id').send(updateUserDto).expect(400);
    });
  });

  describe('DELETE /users/:id', () => {
    let userId: string;
    let createUserDto: { name: string; email: string };

    beforeEach(async () => {
      createUserDto = {
        name: 'Liza',
        email: `liza${Date.now()}@gmail.com`,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      userId = response.body.id;
    });

    it('should delete a user', async () => {
      await request(app.getHttpServer()).delete(`/users/${userId}`).expect(204);

      await request(app.getHttpServer()).get(`/users/${userId}`).expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      await request(app.getHttpServer()).delete(`/users/${nonExistentId}`).expect(404);
    });
  });

  describe('GET /users/:id', () => {
    let userId: string;
    let createUserDto: { name: string; email: string };

    beforeEach(async () => {
      createUserDto = {
        name: 'Liza',
        email: `liza${Date.now()}@gmail.com`,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      userId = response.body.id;
    });

    it('should return a user', async () => {
      const response = await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        ...createUserDto,
      });
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      await request(app.getHttpServer()).get(`/users/${nonExistentId}`).expect(404);
    });
  });

  describe('GET /users', () => {
    beforeEach(async () => {
      const users = [
        { name: 'Liza', email: `liza${Date.now()}@example.com` },
        { name: 'Dasha', email: `dasha${Date.now()}@example.com` },
        { name: 'Felix', email: `felix${Date.now()}@example.com` },
      ];

      for (const user of users) {
        await request(app.getHttpServer()).post('/users').send(user).expect(201);
      }
    });

    it('should return paginated users', async () => {
      const response = await request(app.getHttpServer()).get('/users?page=1&limit=2').expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        page: 1,
        limit: 2,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      await request(app.getHttpServer()).get('/users?page=0&limit=10').expect(400);

      await request(app.getHttpServer()).get('/users?page=1&limit=0').expect(400);
    });
  });
});
