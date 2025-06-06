import { Injectable, Logger } from '@nestjs/common';
import { Channel } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { UserCreatedDto } from './dto/user-created.dto';
import { UserDeletedDto } from './dto/user-deleted.dto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  public async processUserCreated(
    data: unknown,
    channel: Channel,
    msg: ConsumeMessage,
  ): Promise<void> {
    try {
      const dto = this.validateDto(UserCreatedDto, data, channel, msg);
      if (!dto) return;

      this.logger.log(
        `[${this.processUserCreated.name}] User created event received. Hello, ${dto.name}!`,
      );
      channel.ack(msg);
    } catch (error) {
      this.logger.error(
        `[${this.processUserCreated.name}] User created event failed:`,
        error.message,
      );
      channel.ack(msg);
    }
  }

  public async processUserDeleted(
    data: unknown,
    channel: Channel,
    msg: ConsumeMessage,
  ): Promise<void> {
    try {
      const dto = this.validateDto(UserDeletedDto, data, channel, msg);
      if (!dto) return;

      this.logger.log(
        `[${this.processUserDeleted.name}] User deleted event received. User with id=${dto.id} was deleted`,
      );
      channel.ack(msg);
    } catch (error) {
      this.logger.error(
        `[${this.processUserDeleted.name}] User deleted event failed:`,
        error.message,
      );
      channel.ack(msg);
    }
  }

  private validateDto<T>(
    type: new () => T,
    rawData: unknown,
    channel: Channel,
    msg: ConsumeMessage,
  ): T | null {
    const dto = plainToInstance(type, rawData as object);

    const errors = validateSync(dto as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const formattedErrors = errors.map(err => ({
        field: err.property,
        message: Object.values(err.constraints || {})[0],
      }));
      this.logger.warn(`[${type.name}] Validation failed:`, formattedErrors);
      channel.ack(msg);
      return null;
    }

    return dto;
  }
}
