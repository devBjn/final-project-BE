import { DynamicModule, Module } from '@nestjs/common';

import { RabbitMQService } from './rabbitmq.service';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
  ],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {
  static registerRmq(service: string, queue: string): DynamicModule {
    const providers = [
      {
        provide: service,
        useFactory: () => {
          return ClientProxyFactory.create({
            transport: Transport.RMQ,
            options: {
              urls: [
                `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}`,
              ],
              // noAck: false,
              queue: 'section_queue_test',
              queueOptions: {
                durable: true,
              },
            },
          });
        },
      },
    ];

    return {
      module: RabbitMQModule,
      providers,
      exports: providers,
    };
  }
}
