import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { MongoExceptionFilter } from './filters/mongo-exception.filter';

async function bootstrap() {
  const logger = new Logger('bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalFilters(new MongoExceptionFilter());

  const port = configService.get<number>('port');
  if (!port) {
    throw new Error('PORT is required environment value');
  }
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/`);
}
bootstrap();
