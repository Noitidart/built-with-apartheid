import { getRequestIp } from '@/lib/cf-utils.backend';
import prisma from '@/lib/prisma';
import type { TPost } from '@/types/post';
import type { TUser } from '@/types/user';
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

async function newPostHandler(req: NextRequest) {
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
      websiteId: true,
      userId: true
    }
  });

  await maybeCreatePromotedToConcernedUserMilestone({
    id: interaction.id,
    websiteId: interaction.websiteId,
    userId: interaction.userId!
  });

  return new Response(JSON.stringify({} satisfies TPostResponseData), {
    status: 201,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

async function maybeCreatePromotedToConcernedUserMilestone(interaction: {
  id: number;
  websiteId: number;
  userId: string;
}) {
  // Check if this is the user's first post on this website
  const preceedingUserPost = await prisma.interaction.findFirst({
    where: {
      websiteId: interaction.websiteId,
      userId: interaction.userId,
      type: 'POST'
    }
  });

  const hasPostedBefore = !!preceedingUserPost;
  if (hasPostedBefore) {
    return;
  }

  await prisma.interaction.create({
    data: {
      type: 'MILESTONE',
      websiteId: interaction.websiteId,
      milestone: {
        create: {
          websiteId: interaction.websiteId,
          data: {
            type: 'user-promoted-to-concerned',
            userId: interaction.userId
          }
        }
      }
    }
  });
}

export default newPostHandler;
