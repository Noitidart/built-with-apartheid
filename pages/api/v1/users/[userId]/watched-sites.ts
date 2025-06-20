import { withPrisma } from '@/lib/prisma';
import { Interaction, PrismaClient, Scan, Website } from '@prisma/client';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

type WatchedSite = Website & {
  interactions: (Interaction & {
    scan: Scan | null;
  })[];
};

export async function getWatchedSitesHandler(
  prisma: PrismaClient,
  req: NextRequest
) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405
    });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 2];

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid userId' }), {
        status: 400
      });
    }

    // Get user's watched sites with their latest scan results
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        watchedSites: {
          include: {
            interactions: {
              where: {
                type: 'SCAN'
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1,
              include: {
                scan: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404
      });
    }

    // Transform the data to include only necessary information
    console.log(user.watchedSites);
    const watchedSites = user.watchedSites.map((site: WatchedSite) => {
      const lastScan = site.interactions[0]?.scan;
      let hasIsraeliTech = false;

      if (lastScan) {
        try {
          // The changes field is already a JSON object, no need to parse
          const changes = lastScan.changes as unknown as Record<string, string>;
          hasIsraeliTech =
            Object.entries(changes).some(
              ([, status]) => status === 'new' || status === 'still-present'
            ) || site.isUnethical;
        } catch (error) {
          console.error('Failed to process scan changes:', error);
        }
      }

      return {
        id: site.id,
        hostname: site.hostname,
        lastScan: site.interactions[0]
          ? {
              date: site.interactions[0].createdAt,
              hasIsraeliTech
            }
          : null
      };
    });

    return new Response(
      JSON.stringify({
        sites: watchedSites
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Database error:', error);

    // Check if it's a Prisma error
    if (
      error instanceof Error &&
      error?.name === 'PrismaClientUnknownRequestError'
    ) {
      return new Response(
        JSON.stringify({
          error: 'Database connection error. Please try again in a few moments.'
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '5'
          }
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export default withPrisma(getWatchedSitesHandler);
