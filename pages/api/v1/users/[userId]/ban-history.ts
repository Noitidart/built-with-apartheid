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
  userId: z.string()
});

export type TGetBanHistoryResponseData = {
  interactions: TBanInteraction[];
};

const getBanHistoryHandler = withPrisma(
  requireMod(async function getBanHistoryHandler(
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

    const { userId } = queryResult.data;

    // Get ban-related interactions for this user
    const interactions = await prisma.interaction.findMany({
      where: {
        AND: [
          {
            type: {
              in: ['BANNED_USER', 'UNBANNED_USER']
            }
          },
          {
            targetUsers: {
              some: {
                id: userId
              }
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: BAN_INTERACTION_SELECT
    });

    return res.status(200).json({
      interactions
    } satisfies TGetBanHistoryResponseData);
  })
);

export default getBanHistoryHandler;
