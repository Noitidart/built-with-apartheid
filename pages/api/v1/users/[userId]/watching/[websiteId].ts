import { withPrisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

export async function checkWatchingHandler(
  prisma: PrismaClient,
  req: NextRequest
) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405
    });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const userId = pathParts[pathParts.length - 3];
  const websiteId = parseInt(pathParts[pathParts.length - 1], 10);

  if (!userId || isNaN(websiteId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid userId or websiteId' }),
      { status: 400 }
    );
  }

  // Check if user exists and is watching the website
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    include: {
      watchers: {
        where: { id: userId }
      }
    }
  });

  if (!website) {
    return new Response(JSON.stringify({ error: 'Website not found' }), {
      status: 404
    });
  }

  return new Response(
    JSON.stringify({
      isWatching: website.watchers.length > 0
    }),
    { status: 200 }
  );
}

export default withPrisma(checkWatchingHandler);
