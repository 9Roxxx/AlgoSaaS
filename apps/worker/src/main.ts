import 'dotenv/config';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { campaignDispatchProcessor } from './processors/campaign-dispatch.processor';
import { sendMessageProcessor } from './processors/send-message.processor';
import { suppressionProcessor } from './processors/suppression.processor';

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5');

console.log('🚀 Starting Algor Worker...\n');

// Campaign Dispatch Worker
const campaignWorker = new Worker('campaign-dispatch', campaignDispatchProcessor, {
  connection: redisConnection,
  concurrency: 2,
});

campaignWorker.on('completed', (job) => {
  console.log(`✅ [campaign-dispatch] Job ${job.id} completed`);
});

campaignWorker.on('failed', (job, err) => {
  console.error(`❌ [campaign-dispatch] Job ${job?.id} failed:`, err.message);
});

// Send Message Worker
const sendWorker = new Worker('send-message', sendMessageProcessor, {
  connection: redisConnection,
  concurrency,
});

sendWorker.on('completed', (job) => {
  console.log(`✅ [send-message] Job ${job.id} completed`);
});

sendWorker.on('failed', (job, err) => {
  console.error(`❌ [send-message] Job ${job?.id} failed:`, err.message);
});

// Suppression Worker
const suppressionWorker = new Worker('suppression', suppressionProcessor, {
  connection: redisConnection,
  concurrency: 3,
});

suppressionWorker.on('completed', (job) => {
  console.log(`✅ [suppression] Job ${job.id} completed`);
});

suppressionWorker.on('failed', (job, err) => {
  console.error(`❌ [suppression] Job ${job?.id} failed:`, err.message);
});

console.log('📦 Workers started:');
console.log('   - campaign-dispatch (concurrency: 2)');
console.log('   - send-message (concurrency: ' + concurrency + ')');
console.log('   - suppression (concurrency: 3)');
console.log('\n⏳ Waiting for jobs...\n');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down workers...');
  await Promise.all([
    campaignWorker.close(),
    sendWorker.close(),
    suppressionWorker.close(),
  ]);
  await redisConnection.quit();
  process.exit(0);
});

