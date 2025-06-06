import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MessageBrokerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageBrokerService.name);

  constructor(@Inject('MESSAGE_BROKER_CLIENT') private readonly client: ClientProxy) {}

  public async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ ${error.message}`);
      throw error;
    }
  }

  public async onModuleDestroy() {
    try {
      await this.client.close();
      this.logger.log('Successfully closed RabbitMQ connection');
    } catch (error) {
      this.logger.error(`Failed to close RabbitMQ connection: ${error.message}`);
      throw error;
    }
  }

  public async emit(pattern: string, data: any): Promise<void> {
    try {
      await firstValueFrom(this.client.emit(pattern, data));
      this.logger.log(`Emitted event [${pattern}]: ${JSON.stringify(data)}`);
    } catch (error) {
      this.logger.error(`Failed to emit event [${pattern}]: ${error.message}`);
      throw error;
    }
  }
}
