import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a deep proxy that safely returns null or empty arrays to prevent build crashes
const createMockPrisma = () => {
  const deepMockHandler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'then') return undefined; // Prevent infinite promise chains
      
      // If it's a findMany or similar that might expect an array, return []
      return new Proxy(function() {}, {
        apply(target, thisArg, argumentsList) {
          if (typeof prop === 'string' && prop.includes('Many')) {
            return Promise.resolve([]);
          }
          return Promise.resolve(null);
        },
        get(t, p, receiver) {
          if (p === 'then') return undefined;
          return deepMockHandler.get!(t, p, receiver);
        }
      });
    }
  };
  return new Proxy({}, deepMockHandler) as PrismaClient;
};

export const db = process.env.SKIP_DB_ON_BUILD === '1'
  ? createMockPrisma()
  : globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.SKIP_DB_ON_BUILD !== '1') {
  globalForPrisma.prisma = db;
}

export const prisma = db;

