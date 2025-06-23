import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { withPrisma } from '@/lib/prisma';
import { castQueryParamAsNumber } from '@/lib/zod.frontend';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const UNWATCH_REQUEST_QUERY_SCHEMA = z.object({
  id: z.string().transform(castQueryParamAsNumber)
});

const unwatchWebsiteHandler = withPrisma(async function unwatchWebsiteHandler(
  prisma: PrismaClient,
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      _errors: {
        formErrors: ['requestErrors.methodNotAllowed'],
        fieldErrors: {}
      }
    });
  }

  const queryParseResult = UNWATCH_REQUEST_QUERY_SCHEMA.safeParse(req.query);
  if (!queryParseResult.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: queryParseResult.error.flatten().fieldErrors
      }
    });
  }
  const { id: websiteId } = queryParseResult.data;

  // Get user
  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: res
  });

  // Get or create IP
  const userIp = await getOrCreateIp(prisma, req, me.id);

  // Check if website exists
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true }
  });

  if (!website) {
    return res.status(404).json({
      _errors: {
        formErrors: ['websiteErrors.notFound'],
        fieldErrors: {}
      }
    });
  }

  // Check if currently watching (for idempotency)
  const isCurrentlyWatching = me.watchedWebsites.some(
    (w) => w.id === websiteId
  );

  // If not watching, return early
  if (!isCurrentlyWatching) {
    return res.status(200).json({
      success: true,
      wasWatching: false
    });
  }

  // Start transaction
  const result = await prisma.$transaction(
    async function updateUserWithUnwatchInteraction(tx) {
      // Disconnect user from website
      await tx.user.update({
        where: { id: me.id },
        data: {
          watchedWebsites: {
            disconnect: { id: websiteId }
          }
        }
      });

      // Create UNWATCHED interaction
      await tx.interaction.create({
        data: {
          type: 'UNWATCHED',
          userId: me.id,
          websiteId: websiteId,
          ipId: userIp.id,
          data: null
        }
      });

      return {
        wasWatching: true
      };
    }
  );

  return res.status(200).json({
    success: true,
    wasWatching: result.wasWatching
  });
});

export default unwatchWebsiteHandler;
