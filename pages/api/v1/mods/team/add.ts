import {
  getMeFromRefreshedToken,
  hashPassword,
  userNanoidGenerator
} from '@/lib/auth.backend';
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

export type TAddModResponseData =
  | Record<string, never>
  | TResponseDataWithErrors;

export type TAddModRequestBody = {
  email: string;
  password: string;
};

const BODY_SCHEMA = z.object({
  email: z.string().email(),
  password: z.string().min(6)
}) satisfies z.ZodType<TAddModRequestBody>;

const addModHandler = withPrisma(async function addModHandler(
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
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: result.error.flatten().fieldErrors
        }
      },
      { status: 400 }
    );
  }

  const { email, password } = result.data;

  // Check if user with this email already exists
  const existingUser = await prisma.user.findFirst({
    where: { email }
  });

  if (existingUser) {
    if (existingUser.isMod) {
      return NextResponse.json(
        {
          _errors: {
            formErrors: ['modErrors.userAlreadyMod'],
            fieldErrors: {}
          }
        },
        { status: 400 }
      );
    }
    // If user exists but is not a mod, we'll update them
  }

  // Hash the password using the same method as login
  const hashedPassword = await hashPassword(password);

  if (existingUser) {
    // Update existing user to be a mod
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        isMod: true,
        password: hashedPassword
      }
    });
  } else {
    // Create new mod user
    await prisma.user.create({
      data: {
        id: userNanoidGenerator(),
        email,
        password: hashedPassword,
        isMod: true
      }
    });
  }

  // Create MOD_ADDED interaction
  await prisma.interaction.create({
    data: {
      type: 'MOD_ADDED',
      userId: me.id,
      userIp: getRequestIp(req) || 'unknown'
    }
  });

  return updateNextResponseJson(response, {}, { status: 201 });
});

export default addModHandler;
