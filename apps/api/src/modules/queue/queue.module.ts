import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

@Module({
  providers: [
    {
      provide: 'CAMPAIGN_DISPATCH_QUEUE',
      useFactory: () => {
        return new Queue('campaign-dispatch', {
          connection: redisConnection,
        });
      },
    },
    {
      provide: 'SEND_MESSAGE_QUEUE',
      useFactory: () => {
        return new Queue('send-message', {
          connection: redisConnection,
        });
      },
    },
    {
      provide: 'SUPPRESSION_QUEUE',
      useFactory: () => {
        return new Queue('suppression', {
          connection: redisConnection,
        });
      },
    },
  ],
  exports: ['CAMPAIGN_DISPATCH_QUEUE', 'SEND_MESSAGE_QUEUE', 'SUPPRESSION_QUEUE'],
})
export class QueueModule {}

