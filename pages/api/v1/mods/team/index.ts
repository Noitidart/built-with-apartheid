import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { withPrisma } from '@/lib/prisma';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import { updateNextResponseJson } from '@/lib/response/response-utils';
import type { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge'
};

export type TGetModsResponseData =
  | { mods: Array<{ id: string; email: string }> }
  | TResponseDataWithErrors;

const getModsHandler = withPrisma(async function getModsHandler(
  prisma: PrismaClient,
  req: NextRequest
) {
  if (req.method !== 'GET') {
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

  const mods = await prisma.user.findMany({
    where: {
      isMod: true,
      email: { not: null }
    },
    select: {
      id: true,
      email: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return updateNextResponseJson(response, { mods }, { status: 200 });
});

export default getModsHandler;
