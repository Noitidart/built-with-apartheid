import { requireMod } from '@/lib/auth.middleware';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { withPrisma } from '@/lib/prisma';
import { isNothingToUpdateError } from '@/lib/prisma-utils';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import type { TUnbannedIpsInteractionData } from '@/types/interaction';
import type { TMe } from '@/types/user';
import { unbanIp } from '@/utils/ban';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const querySchema = z.object({
  ipId: z.string().transform(Number)
});

export type TUnbanIpRequestBody = {
  reason: string;
};

const unbanIpRequestBodySchema = z.object({
  reason: z.string().min(1, 'Reason is required')
}) satisfies z.ZodSchema<TUnbanIpRequestBody>;

type TUnbanIpResponseData = { success: true } | TResponseDataWithErrors;

const unbanIpHandler = withPrisma(
  requireMod(async function unbanIpHandler(
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
      } satisfies TUnbanIpResponseData);
    }

    const queryResult = querySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: queryResult.error.flatten().fieldErrors
        }
      } satisfies TUnbanIpResponseData);
    }

    const { ipId } = queryResult.data;

    const bodyResult = unbanIpRequestBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: bodyResult.error.flatten().fieldErrors
        }
      } satisfies TUnbanIpResponseData);
    }

    const { reason } = bodyResult.data;

    const moderatorIp = await getOrCreateIp(prisma, req, me.id);

    await prisma
      .$transaction(async (tx) => {
        const ip = await tx.ip.update({
          where: { id: ipId },
          data: { isBanned: false },
          select: { value: true }
        });

        await tx.interaction.create({
          data: {
            type: 'UNBANNED_IPS',
            userId: me.id,
            ipId: moderatorIp.id,
            data: {
              reason
            } satisfies TUnbannedIpsInteractionData,
            targetIps: {
              connect: { id: ipId }
            }
          }
        });

        await unbanIp(ip.value);
      })
      .catch((error) => {
        if (isNothingToUpdateError(error)) {
          return res.status(404).json({
            _errors: {
              formErrors: ['requestErrors.notFound'],
              fieldErrors: { ipId: ['IP not found'] }
            }
          } satisfies TUnbanIpResponseData);
        }
        throw error;
      });

    if (res.headersSent) return;

    return res.status(200).json({
      success: true
    } satisfies TUnbanIpResponseData);
  })
);

export default unbanIpHandler;
