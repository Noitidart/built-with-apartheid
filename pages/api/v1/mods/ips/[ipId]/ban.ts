import { requireMod } from '@/lib/auth.middleware';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { withPrisma } from '@/lib/prisma';
import { isNothingToUpdateError } from '@/lib/prisma-utils';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import type { TBannedIpsInteractionData } from '@/types/interaction';
import type { TMe } from '@/types/user';
import { banIp } from '@/utils/ban';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const querySchema = z.object({
  ipId: z.string().transform(Number)
});

export type TBanIpRequestBody = {
  reason: string;
};

const banIpRequestBodySchema = z.object({
  reason: z.string().min(1, 'Reason is required')
}) satisfies z.ZodSchema<TBanIpRequestBody>;

type TBanIpResponseData = { success: true } | TResponseDataWithErrors;

const banIpHandler = withPrisma(
  requireMod(async function banIpHandler(
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
      } satisfies TBanIpResponseData);
    }

    const queryResult = querySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: queryResult.error.flatten().fieldErrors
        }
      } satisfies TBanIpResponseData);
    }

    const { ipId } = queryResult.data;

    const bodyResult = banIpRequestBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: bodyResult.error.flatten().fieldErrors
        }
      } satisfies TBanIpResponseData);
    }

    const { reason } = bodyResult.data;

    // Get the moderator's IP
    const moderatorIp = await getOrCreateIp(prisma, req, me.id);

    // Perform all operations in a transaction
    await prisma
      .$transaction(async (tx) => {
        // Ban the IP
        const ip = await tx.ip.update({
          where: { id: ipId },
          data: { isBanned: true },
          select: { value: true }
        });

        // Create interaction record
        await tx.interaction.create({
          data: {
            type: 'BANNED_IPS',
            userId: me.id,
            ipId: moderatorIp.id,
            data: {
              reason
            } satisfies TBannedIpsInteractionData,
            targetIps: {
              connect: { id: ipId }
            }
          }
        });

        await banIp(ip.value);
      })
      .catch((error) => {
        if (isNothingToUpdateError(error)) {
          return res.status(404).json({
            _errors: {
              formErrors: ['requestErrors.notFound'],
              fieldErrors: { ipId: ['IP not found'] }
            }
          } satisfies TBanIpResponseData);
        }
        throw error;
      });

    if (res.headersSent) return;

    return res.status(200).json({
      success: true
    } satisfies TBanIpResponseData);
  })
);

export default banIpHandler;
