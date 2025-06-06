import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMqHealthIndicator {
  private readonly logger = new Logger(RabbitMqHealthIndicator.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  public async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      const brokerUri = this.configService.get<string>('brokerUri');
      const connection = await amqplib.connect(brokerUri!);
      await connection.close();

      return this.healthIndicatorService.check(key).up();
    } catch (error) {
      this.logger.error('RabbitMQ health check failed', error);
      throw error;
    }
  }
}
