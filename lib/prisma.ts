import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!
  });
  const prisma = new PrismaClient({ adapter });
  return prisma;
}

/**
 * Higher-order function that wraps Next.js API handlers with automatic Prisma client
 * management for Cloudflare Workers edge environment.
 *
 * Specifically designed for API routes that handle a single request and then disconnect.
 * Do NOT use for long-running processes or frequently called functions as it creates
 * and destroys a database connection on each invocation.
 */
export function withPrisma(
  handler: (prisma: PrismaClient, req: NextRequest) => Promise<Response>
) {
  return async function wrappedApiHandler(req: NextRequest): Promise<Response> {
    const prisma = createPrismaClient();
    try {
      return await handler(prisma, req);
    } finally {
      await prisma.$disconnect();
    }
  };
}

export default createPrismaClient;
