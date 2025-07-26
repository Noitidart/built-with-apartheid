import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { withPrisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { InteractionType } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const querySchema = z.object({
  websiteId: z.string().transform(Number)
});

const createViewHandler = withPrisma(async function createViewHandler(
  prisma: PrismaClient,
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: result.error.flatten().fieldErrors
      }
    });
  }
  const { websiteId } = result.data;

  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: res
  });
  const userId = me.id;

  const userIp = await getOrCreateIp(prisma, req, userId);
  const view = await prisma.interaction.create({
    data: {
      type: 'VIEW' as InteractionType,
      websiteId,
      userId,
      ipId: userIp.id,
      data: null
    }
  });

  return res.status(200).json({ success: true, viewId: view.id });
});

export default createViewHandler;
