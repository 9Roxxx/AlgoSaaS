import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  // Setup test database
  process.env.DATABASE_URL = process.env.DATABASE_URL || 
    'postgresql://algor:algor123@localhost:5432/algor_orchestrator_test?schema=public';
  process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
  process.env.JWT_SECRET = 'test-secret';
});

afterAll(async () => {
  // Cleanup
});

