import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { withPrisma } from '@/lib/prisma';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

export type TGetModsResponseData =
  | { mods: Array<{ id: string; email: string }> }
  | TResponseDataWithErrors;

const getModsHandler = withPrisma(async function getModsHandler(
  prisma: PrismaClient,
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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

  if (!me.isAuthenticated || !me.isMod) {
    return res.status(401).json({
      _errors: {
        formErrors: ['requestErrors.unauthorized'],
        fieldErrors: {}
      }
    });
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

  return res.status(200).json({ mods });
});

export default getModsHandler;
