import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessageBrokerService } from './message-broker.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'MESSAGE_BROKER_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const brokerUri = configService.get<string>('brokerUri');
          const queueName = configService.get<string>('queueName');

          if (!brokerUri || !queueName) {
            throw new Error('BROKER_URI and QUEUE_NAME are required environment values');
          }

          return {
            transport: Transport.RMQ,
            options: {
              urls: [brokerUri],
              queue: queueName,
              queueOptions: { durable: true },
              noAck: true,
              prefetchCount: 10,
            },
          };
        },
      },
    ]),
  ],
  providers: [MessageBrokerService],
  exports: [MessageBrokerService],
})
export class MessageBrokerModule {}
