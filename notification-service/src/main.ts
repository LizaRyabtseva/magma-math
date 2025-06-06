import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { EventExceptionFilter } from './filters/event-exception.filter';

async function bootstrap() {
  const logger = new Logger('bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const brokerUri = configService.get<string>('brokerUri');
  const queueName = configService.get<string>('queueName');
  const port = configService.get<number>('port');

  if (!brokerUri || !queueName || !port) {
    throw new Error('BROKER_URI, QUEUE_NAME, PORT are required environment values');
  }

  app.useGlobalFilters(new EventExceptionFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [brokerUri],
      queue: queueName,
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: 10,
    },
  });

  await app.listen(port);
  logger.log(`Http service is running on port ${port}`);

  await app.startAllMicroservices();
  logger.log('RabbitMQ microservice is listening');
}

bootstrap();
