import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse
} from 'next';

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!
  });
  const prisma = new PrismaClient({ adapter });
  return prisma;
}

/**
 * Higher-order function that wraps Next.js API handlers with automatic Prisma client
 * management.
 *
 * Specifically designed for API routes that handle a single request and then disconnect.
 * Do NOT use for long-running processes or frequently called functions as it creates
 * and destroys a database connection on each invocation.
 */
export function withPrisma(
  handler: (
    prisma: PrismaClient,
    req: NextApiRequest,
    res: NextApiResponse
  ) => Promise<void>
) {
  return async function wrappedApiHandler(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void> {
    const prisma = createPrismaClient();
    try {
      await handler(prisma, req, res);
    } finally {
      await prisma.$disconnect();
    }
  };
}

/**
 * Higher-order function that wraps Next.js getServerSideProps with automatic Prisma
 * client management.
 *
 * Specifically designed for SSR functions that handle a single request and then
 * disconnect. Do NOT use for long-running processes as it creates and destroys a
 * database connection on each invocation.
 */
export function withPrismaSSR<T extends Record<string, unknown>>(
  handler: (
    prisma: PrismaClient,
    context: GetServerSidePropsContext
  ) => Promise<{ props: T }>
) {
  return async function getServerSidePropsWithPrisma(
    context: GetServerSidePropsContext
  ): Promise<{ props: T }> {
    const prisma = createPrismaClient();
    try {
      return await handler(prisma, context);
    } finally {
      await prisma.$disconnect();
    }
  };
}

export default createPrismaClient;
