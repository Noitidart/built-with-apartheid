import {
  getMeFromRefreshedToken,
  setTokenCookie,
  verifyPassword
} from '@/lib/auth.backend';
import { withPrisma } from '@/lib/prisma';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import type { TMe } from '@/types/user';
import type { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const config = {
  runtime: 'edge'
};

export type TLoginRequestBody = {
  email: string;
  password: string;
};

const loginRequestBodySchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1)
}) satisfies z.ZodSchema<TLoginRequestBody>;

type TLoginResponseData =
  | { success: true; me: TMe }
  | (TResponseDataWithErrors & { success: false });

const loginHandler = withPrisma(async function loginHandler(
  prisma,
  req: NextRequest
) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      {
        success: false,
        _errors: {
          formErrors: ['requestErrors.methodNotAllowed'],
          fieldErrors: {}
        }
      } satisfies TLoginResponseData,
      { status: 405 }
    );
  }

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: {}
        }
      } satisfies TLoginResponseData,
      { status: 400 }
    );
  }

  const bodyParseResult = loginRequestBodySchema.safeParse(rawBody);
  if (!bodyParseResult.success) {
    return NextResponse.json(
      {
        success: false,
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: bodyParseResult.error.flatten().fieldErrors
        }
      } satisfies TLoginResponseData,
      { status: 400 }
    );
  }

  const body = bodyParseResult.data;

  const user = await prisma.user.findUnique({
    where: { email: body.email.trim() },
    select: {
      id: true,
      email: true,
      password: true,
      isMod: true
    }
  });

  if (!user || !user.password) {
    return NextResponse.json(
      {
        success: false,
        _errors: {
          formErrors: ['authErrors.invalidCredentials'],
          fieldErrors: {}
        }
      } satisfies TLoginResponseData,
      { status: 401 }
    );
  }

  const isValidPassword = await verifyPassword({
    password: body.password,
    hashedPassword: user.password
  });
  if (!isValidPassword) {
    return NextResponse.json(
      {
        success: false,
        _errors: {
          formErrors: ['authErrors.invalidCredentials'],
          fieldErrors: {}
        }
      } satisfies TLoginResponseData,
      { status: 401 }
    );
  }

  // Create a temporary response to check for anonymous user
  const tempResponse = NextResponse.json({});
  const currentMe = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: tempResponse
  });

  // If there's a current anonymous user and the logging in user is different, merge them
  if (currentMe.id !== user.id && !currentMe.email) {
    await mergeAnonymousUserToAuthenticatedUser({
      prisma,
      anonymousUserId: currentMe.id,
      authenticatedUserId: user.id
    });
  }

  const me: TMe = {
    id: user.id,
    email: user.email,
    isMod: user.isMod,
    isAuthenticated: true
  };

  const response = NextResponse.json(
    {
      success: true,
      me
    } satisfies TLoginResponseData,
    { status: 200 }
  );

  // Set authentication cookie
  await setTokenCookie(response, {
    userId: me.id,
    isAuthenticated: me.isAuthenticated
  });

  return response;
});

async function mergeAnonymousUserToAuthenticatedUser(inputs: {
  prisma: PrismaClient;
  anonymousUserId: string;
  authenticatedUserId: string;
}) {
  const { prisma, anonymousUserId, authenticatedUserId } = inputs;

  const anonymousUser = await prisma.user.findUnique({
    where: { id: anonymousUserId }
  });
  if (!anonymousUser) {
    // Exit as the anonymous user doesn't exist in the database, it's just a
    // local anonymous user.
    return;
  }

  // Update all interactions from anonymous user to authenticated user
  await prisma.interaction.updateMany({
    where: { userId: anonymousUserId },
    data: { userId: authenticatedUserId }
  });

  // Update all scans from anonymous user to authenticated user
  await prisma.scan.updateMany({
    where: { userId: anonymousUserId },
    data: { userId: authenticatedUserId }
  });

  // Update all posts from anonymous user to authenticated user
  await prisma.post.updateMany({
    where: { userId: anonymousUserId },
    data: { userId: authenticatedUserId }
  });

  // Delete the anonymous user
  await prisma.user.delete({
    where: { id: anonymousUserId }
  });
}

export default loginHandler;
