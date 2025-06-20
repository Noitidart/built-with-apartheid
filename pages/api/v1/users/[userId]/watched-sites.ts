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

interface ScanChanges {
  type: string;
  companyId?: string;
  status?: 'DETECTED' | 'NOT_DETECTED';
  timestamp?: string;
}

export async function getWatchedSitesHandler(
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
  const watchedSites = user.watchedSites.map((site: WatchedSite) => {
    const lastScan = site.interactions[0]?.scan;
    let hasIsraeliTech = false;

    if (lastScan) {
      try {
        const changes = JSON.parse(lastScan.changes as string) as ScanChanges[];
        hasIsraeliTech = changes.some(
          (change) => change.type === 'DETECTED_COMPANY'
        );
      } catch (error) {
        console.error('Failed to parse scan changes:', error);
      }
    }

    // if (lastScan && lastScan.changes) {
    //   // The changes field is already an object, no need to parse
    //   const changes = lastScan.changes as unknown as ScanChanges[];
    //   hasIsraeliTech = changes.some(
    //     (change) => change.type === 'DETECTED_COMPANY'
    //   );
    // }

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
}

export default withPrisma(getWatchedSitesHandler);
