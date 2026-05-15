// lib/prisma.ts — Singleton de Prisma Client
// Evita crear múltiples instancias en modo desarrollo (hot reload)

import { PrismaClient } from '@prisma/client';

// Parche para serializar BigInt a JSON automáticamente
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
