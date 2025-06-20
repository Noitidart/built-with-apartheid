import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { withPrisma } from '@/lib/prisma';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

export type TRemoveModResponseData =
  | Record<string, never>
  | TResponseDataWithErrors;

export type TRemoveModRequestBody = {
  userId: string;
};

const BODY_SCHEMA = z.object({
  userId: z.string().min(1, 'User ID is required')
}) satisfies z.ZodType<TRemoveModRequestBody>;

const removeModHandler = withPrisma(async function removeModHandler(
  prisma: PrismaClient,
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('removeModHandler', req.method);
  if (req.method !== 'POST') {
    return res.status(405).json({
      _errors: {
        formErrors: ['requestErrors.methodNotAllowed'],
        fieldErrors: {}
      }
    });
  }

  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: res
  });

  // Check if user is authenticated and is a moderator
  if (!me.isAuthenticated || !me.isMod) {
    return res.status(401).json({
      _errors: {
        formErrors: ['requestErrors.unauthorized'],
        fieldErrors: {}
      }
    });
  }

  // Parse request body
  const unknownBody = req.body;

  const result = BODY_SCHEMA.safeParse(unknownBody);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid request data',
      details: result.error.flatten().fieldErrors
    });
  }

  const { userId } = result.data;

  // Check if the user exists and is a mod
  const userToRemove = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isMod: true }
  });

  if (!userToRemove) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!userToRemove.isMod) {
    return res.status(400).json({
      _errors: {
        formErrors: ['modErrors.userNotMod'],
        fieldErrors: {}
      }
    });
  }

  // Update user to remove mod status
  await prisma.user.update({
    where: { id: userId },
    data: { isMod: false }
  });

  // Get or create IP for the moderator
  const moderatorIp = await getOrCreateIp(prisma, req, me.id);

  // Create MOD_REMOVED interaction
  await prisma.interaction.create({
    data: {
      type: 'MOD_REMOVED',
      userId: me.id,
      ipId: moderatorIp.id,
      data: null,
      targetUsers: { connect: { id: userId } }
    }
  });

  return res.status(201).json({});
});

export default removeModHandler;
