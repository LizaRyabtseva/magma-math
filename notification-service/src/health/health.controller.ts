import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { RabbitMqHealthIndicator } from './rabbitmq-health-indicator.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly rabbitMqHealthIndicator: RabbitMqHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  public check() {
    return this.health.check([() => this.rabbitMqHealthIndicator.pingCheck('rabbitmq')]);
  }
}
