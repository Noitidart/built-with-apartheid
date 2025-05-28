import { COMPANIES } from '@/constants/companies';
import { withPrisma } from '@/lib/prisma';
import { isFirstScanMilestone } from '@/types/milestone';
import type { PrismaClient } from '@prisma/client';
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
  recentPosts: Array<{
    id: number;
    createdAt: string;
    body: string;
    userId: string;
    website: {
      hostname: string;
    };
  }>;
  recentDetections: Array<{
    id: number;
    createdAt: string;
    companyId: string;
    companyName: string;
    website: {
      hostname: string;
    };
  }>;
  recentRemovals: Array<{
    id: number;
    createdAt: string;
    companyId: string;
    companyName: string;
    website: {
      hostname: string;
    };
  }>;
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

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Scans query
  const scanInteractions = await prisma.interaction.findMany({
    where: {
      type: 'SCAN',
      createdAt: { gte: sevenDaysAgo }
    },
    select: {
      dataInteractionForMilestones: {
        select: {
          data: true
        }
      }
    }
  });

  const scans7d = {
    total: scanInteractions.length,
    new: scanInteractions.filter(function isFirstScanInteraction(interaction) {
      return interaction.dataInteractionForMilestones.some(
        isFirstScanMilestone
      );
    }).length
  };

  // Unique posters query
  const posters = await prisma.user.findMany({
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
    total: posters.length,
    new: posters.filter(function isUsersFirstPostWithinLastSevenDays(user) {
      // If the user was selected in this query he must have at least one post
      const firstPostEver = user.posts[0];
      if (!firstPostEver) {
        throw new Error(
          'Impossible unless dev messed up the posters query to select users that do not have posts'
        );
      }

      return firstPostEver.createdAt >= sevenDaysAgo;
    }).length
  };

  // Get recent posts (last 10)
  const recentPostInteractions = await prisma.interaction.findMany({
    where: {
      type: 'POST'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      userId: true,
      website: {
        select: {
          hostname: true
        }
      },
      post: {
        select: {
          body: true
        }
      }
    }
  });

  // Get recent detections (company-added milestones)
  const recentDetectionInteractions = await prisma.interaction.findMany({
    where: {
      type: 'MILESTONE',
      OR: [
        {
          milestone: {
            data: {
              path: ['type'],
              equals: 'company-added-first-time'
            }
          }
        },
        {
          milestone: {
            data: {
              path: ['type'],
              equals: 'company-added-back'
            }
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
      website: {
        select: {
          hostname: true
        }
      },
      milestone: {
        select: {
          data: true
        }
      }
    }
  });

  // Get recent removals (company-removed milestones)
  const recentRemovalInteractions = await prisma.interaction.findMany({
    where: {
      type: 'MILESTONE',
      milestone: {
        OR: [
          {
            data: {
              path: ['type'],
              equals: 'company-removed-but-has-others'
            }
          },
          {
            data: {
              path: ['type'],
              equals: 'company-removed-and-no-others'
            }
          }
        ]
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      website: {
        select: {
          hostname: true
        }
      },
      milestone: {
        select: {
          data: true
        }
      }
    }
  });

  // Transform the data
  const recentPosts = recentPostInteractions.map((interaction) => ({
    id: interaction.id,
    createdAt: interaction.createdAt.toISOString(),
    body: interaction.post?.body || '',
    userId: interaction.userId || 'anonymous',
    website: {
      hostname: interaction.website.hostname
    }
  }));

  const recentDetections = recentDetectionInteractions.map((interaction) => {
    const milestoneData = interaction.milestone
      ?.data as PrismaJson.TMilestoneData;
    const companyId =
      (milestoneData as { companyId?: string })?.companyId || 'unknown';
    const companyInfo = COMPANIES.find((c) => c.id === companyId);

    return {
      id: interaction.id,
      createdAt: interaction.createdAt.toISOString(),
      companyId,
      companyName: companyInfo?.name || companyId,
      website: {
        hostname: interaction.website.hostname
      }
    };
  });

  const recentRemovals = recentRemovalInteractions.map((interaction) => {
    const milestoneData = interaction.milestone
      ?.data as PrismaJson.TMilestoneData;
    const companyId =
      (milestoneData as { companyId?: string })?.companyId || 'unknown';
    const companyInfo = COMPANIES.find((c) => c.id === companyId);

    return {
      id: interaction.id,
      createdAt: interaction.createdAt.toISOString(),
      companyId,
      companyName: companyInfo?.name || companyId,
      website: {
        hostname: interaction.website.hostname
      }
    };
  });

  return new Response(
    JSON.stringify({
      scans7d,
      uniquePosters7d,
      recentPosts,
      recentDetections,
      recentRemovals
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
