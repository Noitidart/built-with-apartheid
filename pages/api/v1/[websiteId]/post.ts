import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { getKeyValue, setKeyValue } from '@/lib/kv';
import { withPrisma } from '@/lib/prisma';
import {
  assertIsPostInteraction,
  type TPostInteraction
} from '@/types/interaction';
import type { TPost } from '@/types/post';
import { emailNewPostToWatchers } from '@/utils/email-watchers/emailNewPostToWatchers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const querySchema = z.object({
  websiteId: z.string().transform(Number)
});

const bodySchema = z.object({
  body: z.string().min(1, 'Content is required').max(500, 'Content too long')
}) satisfies z.ZodType<TPostRequestBody>;

export type TPostRequestBody = {
  body: TPost['body'];
};

import type { TMe } from '@/types/user';

export type TPostResponseData = {
  me: TMe;
};

const newPostHandler = withPrisma(async function newPostHandler(
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

  const query = req.query;

  const unknownBody = req.body;

  const queryResult = querySchema.safeParse(query);

  if (!queryResult.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: queryResult.error.flatten().fieldErrors
      }
    });
  }

  const { websiteId } = queryResult.data;

  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: res
  });
  const userId = me.id;

  const rateLimitKey = `retry-post-after:${userId}`;
  // Check rate limit
  {
    const retryAfterDate = await getKeyValue<string>(rateLimitKey);

    if (retryAfterDate) {
      const retryTime = new Date(retryAfterDate).getTime();
      const now = Date.now();

      if (now < retryTime) {
        const retryAfterSeconds = Math.ceil((retryTime - now) / 1000);
        res.setHeader('Retry-After', retryAfterSeconds.toString());
        return res.status(429).json({
          _errors: {
            formErrors: [
              [
                'requestErrors.rateLimitExceeded',
                { retryAfter: retryAfterDate }
              ]
            ],
            fieldErrors: {}
          }
        });
      }
    }
  }

  // Get or create IP for the user
  const userIp = await getOrCreateIp(prisma, req, userId);

  const bodyResult = bodySchema.safeParse(unknownBody);

  if (!bodyResult.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: bodyResult.error.flatten().fieldErrors
      }
    });
  }

  const { body: content } = bodyResult.data;

  // User already ensured to exist by getMeFromRefreshedToken

  // Verify website exists
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true }
  });

  if (!website) {
    return res.status(404).json({
      _errors: {
        formErrors: ['requestErrors.notFound'],
        fieldErrors: { websiteId: ['requestErrors.notFound'] }
      }
    });
  }

  const interaction = await prisma.interaction.create({
    data: {
      type: 'POST',
      websiteId,
      userId,
      ipId: userIp.id,
      post: {
        create: {
          body: content.trim(),
          userId,
          websiteId
        }
      }
    },
    select: {
      id: true,
      type: true,
      websiteId: true,
      userId: true
    }
  });

  assertIsPostInteraction(interaction);

  await maybeCreatePromotedToConcernedUserMilestone({
    prisma,
    mostRecentPostInteraction: interaction
  });

  // Send email notifications to watchers in the background
  getCloudflareContext().ctx.waitUntil(
    emailNewPostToWatchers({
      prisma,
      interactionId: interaction.id
    }).catch((error) => {
      console.error('Failed to send new post email:', error);
    })
  );

  // Set rate limit for next post
  {
    const cooldownSeconds = 60;
    const retryAfterDate = new Date(
      Date.now() + cooldownSeconds * 1000
    ).toISOString();
    await setKeyValue(rateLimitKey, retryAfterDate, { ttl: cooldownSeconds });
  }

  return res.status(201).json({ me } satisfies TPostResponseData);
});

async function maybeCreatePromotedToConcernedUserMilestone(inputs: {
  prisma: PrismaClient;
  mostRecentPostInteraction: Pick<
    TPostInteraction,
    'id' | 'userId' | 'websiteId'
  >;
}) {
  // Check if this is the user's first post on this website
  const preceedingUserPost = await inputs.prisma.interaction.findFirst({
    where: {
      id: { lt: inputs.mostRecentPostInteraction.id },
      userId: inputs.mostRecentPostInteraction.userId,
      type: 'POST',
      websiteId: inputs.mostRecentPostInteraction.websiteId
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: { id: true }
  });

  const hastPostedOnThisWebsiteBefore = !!preceedingUserPost;
  if (hastPostedOnThisWebsiteBefore) {
    return;
  }

  await inputs.prisma.interaction.create({
    data: {
      type: 'MILESTONE',
      websiteId: inputs.mostRecentPostInteraction.websiteId,
      milestone: {
        create: {
          websiteId: inputs.mostRecentPostInteraction.websiteId,
          dataInteractionId: inputs.mostRecentPostInteraction.id,
          data: {
            type: 'user-promoted-to-concerned'
          }
        }
      }
    }
  });
}

export default newPostHandler;
