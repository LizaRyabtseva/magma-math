import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RabbitMqHealthIndicator } from './rabbitmq-health-indicator.service';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [ConfigModule, TerminusModule],
  controllers: [HealthController],
  providers: [RabbitMqHealthIndicator],
})
export class HealthModule {}
