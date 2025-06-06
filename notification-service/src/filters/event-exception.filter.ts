import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { RmqContext } from '@nestjs/microservices';

@Catch()
export class EventExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(EventExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToRpc();
    const rmqCtx = ctx.getContext<RmqContext>();
    const channel = rmqCtx.getChannelRef();
    const msg = rmqCtx.getMessage() as ConsumeMessage;
    const pattern = ctx.getData()?.pattern || 'unknown';

    this.logger.error(
      `[${pattern}] Unhandled exception`,
      exception instanceof Error ? exception.stack : exception,
    );

    channel.ack(msg);
  }
}
