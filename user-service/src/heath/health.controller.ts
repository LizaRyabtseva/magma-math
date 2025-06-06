import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { RabbitMqHealthIndicator } from './rabbitmq-health-indicator.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongooseIndicator: MongooseHealthIndicator,
    private rabbitMqHealthIndicator: RabbitMqHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  public check() {
    return this.health.check([
      () => this.mongooseIndicator.pingCheck('mongo', { timeout: 3000 }),
      () => this.rabbitMqHealthIndicator.pingCheck('rabbitMq'),
    ]);
  }
}
