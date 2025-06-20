import {
  getMeFromRefreshedToken,
  hashPassword,
  setTokenCookie,
  verifyPassword
} from '@/lib/auth.backend';
import { withPrisma } from '@/lib/prisma';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import type { TMe } from '@/types/user';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

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
  prisma: PrismaClient,
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      _errors: {
        formErrors: ['requestErrors.methodNotAllowed'],
        fieldErrors: {}
      }
    } satisfies TLoginResponseData);
  }

  const rawBody = req.body;

  const bodyParseResult = loginRequestBodySchema.safeParse(rawBody);
  if (!bodyParseResult.success) {
    return res.status(400).json({
      success: false,
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: bodyParseResult.error.flatten().fieldErrors
      }
    } satisfies TLoginResponseData);
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

  if (!user || (!user.isMod && !user.password)) {
    // If is not a mod, and has no password, return 401, they don't get accounts.
    return res.status(401).json({
      success: false,
      _errors: {
        formErrors: ['authErrors.invalidCredentials'],
        fieldErrors: {}
      }
    } satisfies TLoginResponseData);
  }

  // If user exists but has no password, set the provided password
  if (!user.password) {
    if (!user.isMod) {
      throw new Error('Non-mod has no password');
    }

    const hashedPassword = await hashPassword(body.password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
  } else {
    // Verify password if user already has one
    const isValidPassword = await verifyPassword({
      password: body.password,
      hashedPassword: user.password
    });

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        _errors: {
          formErrors: ['authErrors.invalidCredentials'],
          fieldErrors: {}
        }
      } satisfies TLoginResponseData);
    }
  }

  // Check for anonymous user
  const currentMe = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: res
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

  // Set authentication cookie
  await setTokenCookie(res, {
    userId: me.id,
    isAuthenticated: me.isAuthenticated
  });

  return res.status(200).json({
    success: true,
    me
  } satisfies TLoginResponseData);
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
