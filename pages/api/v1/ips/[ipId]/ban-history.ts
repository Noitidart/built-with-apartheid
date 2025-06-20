import { requireMod } from '@/lib/auth.middleware';
import { withPrisma } from '@/lib/prisma';
import {
  BAN_INTERACTION_SELECT,
  type TBanInteraction
} from '@/types/ban-interaction';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const querySchema = z.object({
  ipId: z.string().transform(Number)
});

export type TGetIpBanHistoryResponseData = {
  interactions: TBanInteraction[];
};

const getIpBanHistoryHandler = withPrisma(
  requireMod(async function getIpBanHistoryHandler(
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

    const queryResult = querySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: queryResult.error.flatten().fieldErrors
        }
      });
    }

    const { ipId } = queryResult.data;

    // Check if IP exists
    const ip = await prisma.ip.findUnique({
      where: { id: ipId }
    });

    if (!ip) {
      return res.status(404).json({
        _errors: {
          formErrors: ['requestErrors.notFound'],
          fieldErrors: { ipId: ['IP not found'] }
        }
      });
    }

    // Get ban interactions for this IP
    const interactions = await prisma.interaction.findMany({
      where: {
        targetIps: {
          some: {
            id: ipId
          }
        },
        type: {
          in: ['BANNED_IPS', 'UNBANNED_IPS']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: BAN_INTERACTION_SELECT
    });

    return res.status(200).json({
      interactions
    } satisfies TGetIpBanHistoryResponseData);
  })
);

export default getIpBanHistoryHandler;
