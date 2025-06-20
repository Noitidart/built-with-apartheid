import { requireMod } from '@/lib/auth.middleware';
import { withPrisma } from '@/lib/prisma';
import type { PrismaClient, InteractionType } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { sub } from 'date-fns';

type TSuspiciousActivity = {
  id: number;
  type: string;
  description: string;
  user?: {
    id: string;
    email: string | null;
  };
  ip?: {
    id: number;
    value: string;
  };
};

export type TGetActivityMonitorResponseData = {
  stats: {
    totalInteractions: number;
    activeUsers: number;
    activeIps: number;
    suspiciousActivities: number;
  };
  suspiciousActivities: TSuspiciousActivity[];
  interactions: Array<{
    id: number;
    createdAt: Date;
    type: InteractionType;
    user: {
      id: string;
      email: string | null;
      isBanned: boolean;
    } | null;
    website: {
      id: number;
      hostname: string;
    } | null;
    ip: {
      id: number;
      value: string;
      city: string | null;
      country: string | null;
      isBanned: boolean;
    } | null;
    scan: {
      changes: PrismaJson.TCompanyStatusChanges;
    } | null;
    post: {
      body: string;
    } | null;
    milestone: {
      data: PrismaJson.TMilestoneData;
    } | null;
    targetUsers: Array<{
      id: string;
      email: string | null;
    }>;
    targetIps: Array<{
      id: number;
      value: string;
    }>;
  }>;
};

const getActivityMonitorHandler = withPrisma(
  requireMod(async function getActivityMonitorHandler(
    prisma: PrismaClient,
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    if (req.method !== 'GET') {
      return res.status(405).json({
        _errors: {
          formErrors: ['requestErrors.methodNotAllowed'],
          fieldErrors: {}
        }
      });
    }

    // Parse query parameters
    const timeRange = (req.query.timeRange as string) || '24h';
    const interactionType = (req.query.interactionType as string) || 'all';

    // Calculate date range
    let startDate: Date;
    switch (timeRange) {
      case '1h':
        startDate = sub(new Date(), { hours: 1 });
        break;
      case '24h':
        startDate = sub(new Date(), { hours: 24 });
        break;
      case '7d':
        startDate = sub(new Date(), { days: 7 });
        break;
      case '30d':
        startDate = sub(new Date(), { days: 30 });
        break;
      default:
        startDate = sub(new Date(), { hours: 24 });
    }

    // Build where clause
    const whereClause: {
      createdAt: { gte: Date };
      type?: InteractionType;
    } = {
      createdAt: { gte: startDate }
    };

    if (interactionType !== 'all') {
      whereClause.type = interactionType as InteractionType;
    }

    // Fetch interactions with all related data
    const interactions = await prisma.interaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: 100, // Limit to most recent 100 interactions
      select: {
        id: true,
        createdAt: true,
        type: true,
        user: {
          select: {
            id: true,
            email: true,
            isBanned: true
          }
        },
        website: {
          select: {
            id: true,
            hostname: true
          }
        },
        ip: {
          select: {
            id: true,
            value: true,
            city: true,
            country: true,
            isBanned: true
          }
        },
        scan: {
          select: {
            changes: true
          }
        },
        post: {
          select: {
            body: true
          }
        },
        milestone: {
          select: {
            data: true
          }
        },
        targetUsers: {
          select: {
            id: true,
            email: true
          }
        },
        targetIps: {
          select: {
            id: true,
            value: true
          }
        }
      }
    });

    // Calculate stats
    const uniqueUserIds = new Set<string>();
    const uniqueIpIds = new Set<number>();
    
    interactions.forEach((interaction) => {
      if (interaction.user) {
        uniqueUserIds.add(interaction.user.id);
      }
      if (interaction.ip) {
        uniqueIpIds.add(interaction.ip.id);
      }
    });

    // Detect suspicious activities
    const suspiciousActivities: TSuspiciousActivity[] = [];

    // Check for rapid posting (more than 5 posts in 5 minutes from same user)
    const userPostCounts = new Map<string, number>();
    const recentPostTime = sub(new Date(), { minutes: 5 });
    
    interactions
      .filter((i) => i.type === 'POST' && i.createdAt >= recentPostTime && i.user)
      .forEach((interaction) => {
        const userId = interaction.user!.id;
        userPostCounts.set(userId, (userPostCounts.get(userId) || 0) + 1);
      });

    userPostCounts.forEach((count, userId) => {
      if (count > 5) {
        const user = interactions.find((i) => i.user?.id === userId)?.user;
        if (user) {
          suspiciousActivities.push({
            id: Date.now() + Math.random(),
            type: 'RAPID_POSTING',
            description: `User posted ${count} times in 5 minutes`,
            user
          });
        }
      }
    });

    // Check for rapid scanning (more than 10 scans in 1 minute from same IP)
    const ipScanCounts = new Map<string, number>();
    const recentScanTime = sub(new Date(), { minutes: 1 });
    
    interactions
      .filter((i) => i.type === 'SCAN' && i.createdAt >= recentScanTime && i.ip)
      .forEach((interaction) => {
        const ipValue = interaction.ip!.value;
        ipScanCounts.set(ipValue, (ipScanCounts.get(ipValue) || 0) + 1);
      });

    ipScanCounts.forEach((count, ipValue) => {
      if (count > 10) {
        const ip = interactions.find((i) => i.ip?.value === ipValue)?.ip;
        if (ip) {
          suspiciousActivities.push({
            id: Date.now() + Math.random(),
            type: 'RAPID_SCANNING',
            description: `IP performed ${count} scans in 1 minute`,
            ip
          });
        }
      }
    });

    // Check for multiple users from same IP
    const ipUserMap = new Map<number, Set<string>>();
    interactions.forEach((interaction) => {
      if (interaction.user && interaction.ip) {
        if (!ipUserMap.has(interaction.ip.id)) {
          ipUserMap.set(interaction.ip.id, new Set());
        }
        ipUserMap.get(interaction.ip.id)!.add(interaction.user.id);
      }
    });

    ipUserMap.forEach((userIds, ipId) => {
      if (userIds.size > 3) {
        const ip = interactions.find((i) => i.ip?.id === ipId)?.ip;
        if (ip) {
          suspiciousActivities.push({
            id: Date.now() + Math.random(),
            type: 'MULTIPLE_USERS_SAME_IP',
            description: `${userIds.size} different users from same IP`,
            ip
          });
        }
      }
    });

    return res.status(200).json({
      stats: {
        totalInteractions: interactions.length,
        activeUsers: uniqueUserIds.size,
        activeIps: uniqueIpIds.size,
        suspiciousActivities: suspiciousActivities.length
      },
      suspiciousActivities,
      interactions
    } satisfies TGetActivityMonitorResponseData);
  })
);

export default getActivityMonitorHandler;