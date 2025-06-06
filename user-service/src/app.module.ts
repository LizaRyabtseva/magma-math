import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageBrokerModule } from './message-broker/message-broker.module';
import { HealthModule } from './heath/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mongoUri = configService.get<string>('mongoUri');
        if (!mongoUri) {
          throw new Error('MONGO_URI is required environment value');
        }
        return {
          uri: mongoUri,
        };
      },
    }),
    UserModule,
    MessageBrokerModule,
    HealthModule,
  ],
})
export class AppModule {}
