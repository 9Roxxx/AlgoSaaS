import { PrismaClient } from '@prisma/client';

// Singleton pattern для Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-export Prisma types
export * from '@prisma/client';

// Middleware для tenant isolation (будет добавлен в будущем)
// prisma.$use(async (params, next) => {
//   // Автоматически фильтровать по tenantId
//   return next(params);
// });

export default prisma;

