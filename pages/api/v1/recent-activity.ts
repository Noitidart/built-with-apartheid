import { COMPANIES } from '@/constants/companies';
import { withPrisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

export type TRecentActivityResponseData = {
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
  recentMilestones: Array<{
    id: number;
    createdAt: string;
    type: string;
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

  // Get other recent milestones
  const recentMilestoneInteractions = await prisma.interaction.findMany({
    where: {
      type: 'MILESTONE',
      milestone: {
        OR: [
          {
            data: {
              path: ['type'],
              equals: 'first-scan'
            }
          },
          {
            data: {
              path: ['type'],
              equals: 'user-promoted-to-concerned'
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

  const recentMilestones = recentMilestoneInteractions.map((interaction) => {
    const milestoneData = interaction.milestone
      ?.data as PrismaJson.TMilestoneData;

    return {
      id: interaction.id,
      createdAt: interaction.createdAt.toISOString(),
      type: milestoneData?.type || 'unknown',
      website: {
        hostname: interaction.website.hostname
      }
    };
  });

  return new Response(
    JSON.stringify({
      recentPosts,
      recentDetections,
      recentRemovals,
      recentMilestones
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
