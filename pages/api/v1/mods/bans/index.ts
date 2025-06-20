import { requireMod } from '@/lib/auth.middleware';
import { withPrisma } from '@/lib/prisma';
import {
  BAN_INTERACTION_SELECT,
  type TBanInteraction
} from '@/types/ban-interaction';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

export type TGetBanDashboardResponseData = {
  stats: {
    totalBannedUsers: number;
    totalBannedIps: number;
    softBannedIps: number;
    hardBannedIps: number;
  };
  recentBanInteractions: TBanInteraction[];
};

const getBanDashboardHandler = withPrisma(
  requireMod(async function getBanDashboardHandler(
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

    const [totalBannedUsers, totalBannedIps, softBannedIps, hardBannedIps] =
      await Promise.all([
        prisma.user.count({
          where: { isBanned: true }
        }),
        prisma.ip.count({
          where: { banLevel: { not: null } }
        }),
        prisma.ip.count({
          where: { banLevel: 'SOFT' }
        }),
        prisma.ip.count({
          where: { banLevel: 'HARD' }
        })
      ]);

    const recentBanInteractions = await prisma.interaction.findMany({
      where: {
        type: {
          in: [
            'BANNED_USER',
            'UNBANNED_USER',
            'SOFT_BANNED_IPS',
            'HARD_BANNED_IPS',
            'UNBANNED_IPS'
          ]
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      select: BAN_INTERACTION_SELECT
    });

    return res.status(200).json({
      stats: {
        totalBannedUsers,
        totalBannedIps,
        softBannedIps,
        hardBannedIps
      },
      recentBanInteractions
    } satisfies TGetBanDashboardResponseData);
  })
);

export default getBanDashboardHandler;
