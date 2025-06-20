import { requireMod } from '@/lib/auth.middleware';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { withPrisma } from '@/lib/prisma';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import type { TUnbannedUserInteractionData } from '@/types/interaction';
import type { TMe } from '@/types/user';
import { unbanIp, unbanUser } from '@/utils/ban';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const querySchema = z.object({
  userId: z.string()
});

export type TUnbanUserRequestBody = {
  reason: string;
};

const unbanUserRequestBodySchema = z.object({
  reason: z.string().min(1, 'Reason is required')
}) satisfies z.ZodSchema<TUnbanUserRequestBody>;

type TUnbanUserResponseData = { success: true } | TResponseDataWithErrors;

const unbanUserHandler = withPrisma(
  requireMod(async function unbanUserHandler(
    prisma: PrismaClient,
    req: NextApiRequest,
    res: NextApiResponse,
    me: TMe
  ) {
    if (req.method !== 'POST') {
      return res.status(405).json({
        _errors: {
          formErrors: ['requestErrors.methodNotAllowed'],
          fieldErrors: {}
        }
      } satisfies TUnbanUserResponseData);
    }

    const queryResult = querySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: queryResult.error.flatten().fieldErrors
        }
      } satisfies TUnbanUserResponseData);
    }

    const { userId } = queryResult.data;

    const bodyResult = unbanUserRequestBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: bodyResult.error.flatten().fieldErrors
        }
      } satisfies TUnbanUserResponseData);
    }

    const { reason } = bodyResult.data;

    // Get the moderator's IP
    const moderatorIp = await getOrCreateIp(prisma, req, me.id);

    // Check if user exists and is banned
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { ips: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        _errors: {
          formErrors: ['requestErrors.notFound'],
          fieldErrors: { userId: ['User not found'] }
        }
      } satisfies TUnbanUserResponseData);
    }

    if (!targetUser.isBanned) {
      return res.status(400).json({
        _errors: {
          formErrors: ['User is not banned'],
          fieldErrors: {}
        }
      } satisfies TUnbanUserResponseData);
    }

    const ipIds = targetUser.ips.map((ip) => ip.id);
    const ipValues = targetUser.ips.map((ip) => ip.value);

    // Perform all operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Unban the user
      await tx.user.update({
        where: { id: userId },
        data: { isBanned: false }
      });

      // Unban all user's IPs
      if (ipIds.length > 0) {
        await tx.ip.updateMany({
          where: { id: { in: ipIds } },
          data: { isBanned: false }
        });
      }

      // Create the interaction record
      await tx.interaction.create({
        data: {
          type: 'UNBANNED_USER',
          userId: me.id,
          ipId: moderatorIp.id,
          data: {
            reason
          } satisfies TUnbannedUserInteractionData,
          targetUsers: {
            connect: { id: userId }
          },
          targetIps: {
            connect: ipIds.map((id) => ({ id }))
          }
        }
      });

      await unbanUser(userId);

      for (const ipValue of ipValues) {
        await unbanIp(ipValue);
      }
    });

    return res.status(200).json({
      success: true
    } satisfies TUnbanUserResponseData);
  })
);

export default unbanUserHandler;
