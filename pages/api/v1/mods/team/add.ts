import {
  getMeFromRefreshedToken,
  hashPassword,
  userNanoidGenerator
} from '@/lib/auth.backend';
import { getRequestIp } from '@/lib/cf-utils.backend';
import { withPrisma } from '@/lib/prisma';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

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


  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: res
  });

  // Check if user is authenticated and is a moderator
  if (!me.isAuthenticated || !me.isMod) {
    return res.status(401).json({
      _errors: {
        formErrors: ['requestErrors.unauthorized'],
        fieldErrors: {}
      }
    });
  }

  // Parse request body
  const unknownBody = req.body;

  const result = BODY_SCHEMA.safeParse(unknownBody);
  if (!result.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: result.error.flatten().fieldErrors
      }
    });
  }

  const { email, password } = result.data;

  // Check if user with this email already exists
  const existingUser = await prisma.user.findFirst({
    where: { email }
  });

  if (existingUser) {
    if (existingUser.isMod) {
      return res.status(400).json({
        _errors: {
          formErrors: ['modErrors.userAlreadyMod'],
          fieldErrors: {}
        }
      });
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

  return res.status(201).json({});
});

export default addModHandler;
