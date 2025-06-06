import { Controller } from '@nestjs/common';
import { EventPattern, Ctx, RmqContext, Payload } from '@nestjs/microservices';
import { ConsumeMessage } from 'amqplib';
import { NotificationService } from './notification.service';

@Controller('')
export class NotificationController {

  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user.created')
  public async handleUserCreated(
    @Payload() data: unknown,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage() as ConsumeMessage;
    await this.notificationService.processUserCreated(data, channel, originalMsg);
  }

  @EventPattern('user.deleted')
  public async handleUserDeleted(
    @Payload() data: unknown,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage() as ConsumeMessage;
    await this.notificationService.processUserDeleted(data, channel, originalMsg);
  }
}
