import { buildIsCreatedAtAfterOrEqual } from '@/lib/date-fns';
import { withPrisma } from '@/lib/prisma';
import { isFirstScanInteraction } from '@/types/interaction';
import type { TMilestone } from '@/types/milestone';
import type { TWebsite } from '@/types/website';
import {
  findManyWebsitesWithEngagement,
  type TWebsiteWithEngagement
} from '@/types/website-with-engagment';
import type { PrismaClient } from '@prisma/client';
import { sub } from 'date-fns';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

export type TRecentActivityResponseData = {
  scans7d: {
    total: number;
    new: number;
  };
  uniquePosters7d: {
    total: number;
    new: number;
  };

  websitesWithPostStats: Array<
    Pick<TWebsite, 'id' | 'hostname'> & {
      posts7d: {
        total: number;
      };
      users7d: {
        total: number;
        new: number;
      };
      latestPostCreatedAt: string;
    }
  >;

  removalMilestones: Array<
    Pick<TMilestone, 'id' | 'createdAt' | 'data'> & {
      website: Pick<TWebsite, 'hostname'>;
    }
  >;

  // websites with high engagement that are EITHER infected or not infected
  // websites with low engagement that are ONLY infected
  spotlightedWebsites: TWebsiteWithEngagement[];
};

async function getRecentActivityHandler(
  prisma: PrismaClient,
  req: NextRequest
) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405
    });
  }

  const sevenDaysAgo = sub(new Date(), { days: 7 });
  const isCreatedAtWithinLastSevenDays =
    buildIsCreatedAtAfterOrEqual(sevenDaysAgo);

  // Scans query
  const scanInteractions = await prisma.interaction.findMany({
    where: {
      type: 'SCAN',
      createdAt: { gte: sevenDaysAgo }
    },
    select: {
      dataInteractionForMilestones: {
        where: {
          data: {
            path: ['type'],
            equals: 'first-scan'
          }
        },
        select: {
          data: true
        }
      }
    }
  });

  const scans7d = {
    total: scanInteractions.length,
    new: scanInteractions.filter(isFirstScanInteraction).length
  };

  // Unique posters query
  const posters7dRaw = await prisma.user.findMany({
    where: {
      posts: {
        some: {
          createdAt: { gte: sevenDaysAgo }
        }
      }
    },
    select: {
      posts: {
        select: {
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 1
      }
    }
  });

  const uniquePosters7d = {
    total: posters7dRaw.length,
    new: posters7dRaw.filter(function isUsersFirstPostWithinLastSevenDays(
      user
    ) {
      // If the user was selected in this query he must have at least one post
      const firstPostEver = user.posts[0];
      if (!firstPostEver) {
        throw new Error(
          'Impossible unless dev messed up the posters query to select users that do not have posts'
        );
      }

      return isCreatedAtWithinLastSevenDays(firstPostEver);
    }).length
  };

  // Build websitesWithPosts7d
  // Find 10 most recent websites with posts
  const recentWebsitesWithPostsRaw = await prisma.website.findMany({
    where: {
      posts: {
        some: {
          createdAt: { gte: sevenDaysAgo }
        }
      }
    },
    select: {
      id: true,
      hostname: true,
      posts: {
        select: {
          createdAt: true,
          userId: true
        },
        where: {
          createdAt: { gte: sevenDaysAgo }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      interactions: {
        select: {
          type: true,
          milestone: {
            select: {
              data: true
            }
          }
        },
        where: {
          type: 'MILESTONE',
          milestone: {
            data: { path: ['type'], equals: 'user-promoted-to-concerned' }
          }
        }
      }
    },
    take: 10
  });

  const websitesWithPostStats: TRecentActivityResponseData['websitesWithPostStats'] =
    recentWebsitesWithPostsRaw.map(function toRecentWebsiteWithPosts(
      rawWebsiteWithPosts
    ) {
      const posts7d = rawWebsiteWithPosts.posts.length;

      const userIds7d = new Set(
        rawWebsiteWithPosts.posts.map((post) => post.userId)
      );

      const latestPostCreatedAt =
        rawWebsiteWithPosts.posts[0]?.createdAt.toISOString();
      if (!latestPostCreatedAt) {
        throw new Error(
          'Impossible unless dev messed up the posts query to select websites that do not have posts'
        );
      }

      return {
        id: rawWebsiteWithPosts.id,
        hostname: rawWebsiteWithPosts.hostname,
        posts7d: {
          total: posts7d
        },
        users7d: {
          total: userIds7d.size,
          // Because we only select interactions that are user-promoted-to-concerned milestones.
          new: rawWebsiteWithPosts.interactions.length
        },
        latestPostCreatedAt
      };
    });

  const removalMilestones = await prisma.milestone.findMany({
    where: {
      OR: [
        {
          data: {
            path: ['type'],
            equals: 'company-removed-and-no-others'
          }
        },
        {
          data: {
            path: ['type'],
            equals: 'company-removed-but-has-others'
          }
        }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      data: true,
      website: {
        select: {
          hostname: true
        }
      }
    }
  });

  // Build spotlightedWebsites.
  // The oldest low effort activity is spotlighted, and the latest high effort activity is spotlighted.
  // Find latest scan interactions for websites that are still infected
  const websitesWithHighEngagment = await findManyWebsitesWithEngagement({
    prisma,
    limit: 10,
    sinceDate: sevenDaysAgo,
    orderBy: 'engagement-score-high-to-low',
    randomize: false,
    infected: false,
    filterByEngagement: 'high'
  });
  const websitesWithLowEngagment = await findManyWebsitesWithEngagement({
    prisma,
    limit: 10,
    sinceDate: sevenDaysAgo,
    orderBy: 'engagement-score-low-to-high',
    randomize: true,
    infected: true,
    filterByEngagement: 'low'
  });

  const spotlightedWebsites = [
    ...websitesWithHighEngagment,
    ...websitesWithLowEngagment
  ].slice(0, 10);

  return new Response(
    JSON.stringify({
      scans7d,
      uniquePosters7d,
      websitesWithPostStats,
      removalMilestones,
      spotlightedWebsites
    } satisfies TRecentActivityResponseData),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

export default withPrisma(getRecentActivityHandler);
