import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getRequestIp } from '@/lib/cf-utils.backend';
import { withPrisma } from '@/lib/prisma';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import { updateNextResponseJson } from '@/lib/response/response-utils';
import type { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const config = {
  runtime: 'edge'
};

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
  req: NextRequest
) {
  console.log('removeModHandler', req.method);
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

  // Create response early so getMeFromRefreshedToken can set cookies
  const response = NextResponse.json({});

  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response
  });

  // Check if user is authenticated and is a moderator
  if (!me.isAuthenticated || !me.isMod) {
    return NextResponse.json(
      {
        _errors: {
          formErrors: ['requestErrors.unauthorized'],
          fieldErrors: {}
        }
      },
      { status: 401 }
    );
  }

  // Parse request body
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

  const result = BODY_SCHEMA.safeParse(unknownBody);
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Invalid request data',
        details: result.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const { userId } = result.data;

  // Check if the user exists and is a mod
  const userToRemove = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isMod: true }
  });

  if (!userToRemove) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!userToRemove.isMod) {
    return NextResponse.json(
      {
        _errors: {
          formErrors: ['modErrors.userNotMod'],
          fieldErrors: {}
        }
      },
      { status: 400 }
    );
  }

  // Update user to remove mod status
  await prisma.user.update({
    where: { id: userId },
    data: { isMod: false }
  });

  // Create MOD_REMOVED interaction
  await prisma.interaction.create({
    data: {
      type: 'MOD_REMOVED',
      userId: me.id,
      userIp: getRequestIp(req) || 'unknown',
      websiteId: null
    }
  });

  return updateNextResponseJson(response, {}, { status: 201 });
});

export default removeModHandler;
