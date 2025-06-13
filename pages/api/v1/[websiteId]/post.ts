import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getRequestIp } from '@/lib/cf-utils.backend';
import { withPrisma } from '@/lib/prisma';
import { updateNextResponseJson } from '@/lib/response/response-utils';
import {
  assertIsPostInteraction,
  type TPostInteraction
} from '@/types/interaction';
import type { TPost } from '@/types/post';
import type { PrismaClient } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const config = {
  runtime: 'edge'
};

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
  req: NextRequest
) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      {
        _errors: {
          formErrors: ['requestErrors.methodNotAllowed'],
          fieldErrors: {}
        }
      },
      { status: 405 }
    );
  }

  const query = Object.fromEntries(req.nextUrl.searchParams);

  let unknownBody;
  try {
    unknownBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        _errors: {
          formErrors: ['requestErrors.invalidBody'],
          fieldErrors: {}
        }
      },
      { status: 400 }
    );
  }

  const queryResult = querySchema.safeParse(query);

  if (!queryResult.success) {
    return NextResponse.json(
      {
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: queryResult.error.flatten().fieldErrors
        }
      },
      { status: 400 }
    );
  }

  const { websiteId } = queryResult.data;

  // Create response early so getMeFromRefreshedToken can set cookies
  const response = NextResponse.json({});

  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response
  });
  const userId = me.id;

  const bodyResult = bodySchema.safeParse(unknownBody);

  if (!bodyResult.success) {
    return NextResponse.json(
      {
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: bodyResult.error.flatten().fieldErrors
        }
      },
      { status: 400 }
    );
  }

  const { body: content } = bodyResult.data;

  // User already ensured to exist by getMeFromRefreshedToken

  // Verify website exists
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true }
  });

  if (!website) {
    return NextResponse.json(
      {
        _errors: {
          formErrors: ['requestErrors.notFound'],
          fieldErrors: { websiteId: ['requestErrors.notFound'] }
        }
      },
      { status: 404 }
    );
  }

  const interaction = await prisma.interaction.create({
    data: {
      type: 'POST',
      websiteId,
      userId,
      userIp: getRequestIp(req) || 'unknown',
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

  return updateNextResponseJson(response, { me } satisfies TPostResponseData, {
    status: 201
  });
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
