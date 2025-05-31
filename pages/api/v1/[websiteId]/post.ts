import { getRequestIp } from '@/lib/cf-utils.backend';
import { withPrisma } from '@/lib/prisma';
import {
  assertIsPostInteraction,
  type TPostInteraction
} from '@/types/interaction';
import type { TPost } from '@/types/post';
import type { TUser } from '@/types/user';
import type { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export const config = {
  runtime: 'edge'
};

const PostRequestQuerySchema = z.object({
  websiteId: z.string().transform(Number)
});

const PostRequestBodySchema = z.object({
  body: z.string().min(1, 'Content is required').max(500, 'Content too long'),
  userId: z.string().min(1, 'User ID is required')
});

export type TPostRequestBody = {
  body: TPost['body'];
  userId: TUser['id'];
};

export type TPostResponseData = Record<string, never>;

async function newPostHandler(prisma: PrismaClient, req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405
    });
  }

  const query = Object.fromEntries(req.nextUrl.searchParams);

  let unknownBody;
  try {
    unknownBody = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400
    });
  }

  const queryResult = PostRequestQuerySchema.safeParse(query);

  if (!queryResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid query parameters' }), {
      status: 400
    });
  }

  const { websiteId } = queryResult.data;

  const bodyResult = PostRequestBodySchema.safeParse(unknownBody);

  if (!bodyResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: bodyResult.error.format()
      }),
      { status: 400 }
    );
  }

  const { body: content, userId } = bodyResult.data;

  // Ensure user exists
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });

  // Verify website exists
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true }
  });

  if (!website) {
    return new Response(JSON.stringify({ error: 'Website not found' }), {
      status: 404
    });
  }

  const interaction = await prisma.interaction.create({
    data: {
      type: 'POST',
      websiteId,
      userId,
      post: {
        create: {
          body: content.trim(),
          userIp: getRequestIp(req) || 'unknown',
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

  return new Response(JSON.stringify({} satisfies TPostResponseData), {
    status: 201,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

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

          // dataInteractionId: inputs.mostRecentPostInteraction.id,
          data: {
            type: 'user-promoted-to-concerned'
          }
        }
      }
    }
  });
}

export default withPrisma(newPostHandler);
