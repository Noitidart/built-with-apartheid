import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { withPrisma } from '@/lib/prisma';
import { isEmpty, orderBy } from 'lodash';

export type TWatchedSitesResponseData = {
  websites: Array<{
    id: number;
    hostname: string;
    lastScan: {
      createdAt: Date;
      infected: boolean;
    } | null;
    lastPostCreatedAt: Date | null;
    totalPosts: number;
  }>;
};

const getWatchedWebsitesHandler = withPrisma(
  async function getWatchedWebsitesHandler(prisma, req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get user
    const me = await getMeFromRefreshedToken({
      prisma,
      request: req,
      response: res
    });

    if (!me) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get watched websites IDs from me
    const watchedWebsiteIds = me.watchedWebsites.map((w) => w.id);

    if (watchedWebsiteIds.length === 0) {
      return res.status(200).json({
        websites: []
      });
    }

    const watchedWebsites = await prisma.website.findMany({
      where: {
        id: {
          in: watchedWebsiteIds
        }
      },
      select: {
        id: true,
        hostname: true,
        // Latest scan interaction
        scans: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            createdAt: true,
            changes: true
          }
        },
        // Latest post
        posts: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            createdAt: true
          }
        },
        // Total posts
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    // Transform the data to include only necessary information
    const websites = watchedWebsites.map(
      function transformWatchedWebsitesToWatchedWebsitesResponseData(website) {
        const lastScan = website.scans[0];

        const lastPost = website.posts[0];

        return {
          id: website.id,
          hostname: website.hostname,
          lastScan: lastScan
            ? {
                createdAt: lastScan.createdAt,
                infected: !isEmpty(lastScan.changes)
              }
            : null,
          lastPostCreatedAt: lastPost?.createdAt || null,
          totalPosts: website._count.posts
        };
      }
    );

    const websitesSortedByLastActivity = orderBy(
      websites,
      function getLastActivity(website) {
        // Get the latest date which max of lastScan.createdAt or lastPostCreatedAt
        const lastScannedAt = website.lastScan?.createdAt.getTime() || 0;
        const lastPostedAt = website.lastPostCreatedAt?.getTime() || 0;

        return Math.max(lastScannedAt, lastPostedAt);
      },
      'desc'
    );

    return res.status(200).json({
      websites: websitesSortedByLastActivity
    } satisfies TWatchedSitesResponseData);
  }
);

export default getWatchedWebsitesHandler;
