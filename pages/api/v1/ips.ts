import { requireMod } from '@/lib/auth.middleware';
import { withPrisma } from '@/lib/prisma';
import { castQueryParamToBoolean } from '@/lib/zod.frontend';
import type { TIp } from '@/types/ip';
import type { TUser } from '@/types/user';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const querySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  banned: z.string().optional().transform(castQueryParamToBoolean)
});

export type TIpWithUsers = Pick<
  TIp,
  'id' | 'value' | 'isBanned' | 'createdAt' | 'city' | 'country'
> & {
  users: Array<Pick<TUser, 'id' | 'email' | 'isBanned'>>;
  _count: {
    users: number;
  };
};

export type TGetIpsResponseData = {
  ips: TIpWithUsers[];
  total: number;
  page: number;
  limit: number;
};

const getIpsHandler = withPrisma(
  requireMod(async function getIpsHandler(
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

    const queryResult = querySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: queryResult.error.flatten().fieldErrors
        }
      });
    }

    const { search, page, limit, banned } = queryResult.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      ...(banned && { isBanned: true }),
      ...(search && {
        OR: [
          { value: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { country: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };

    // Get total count
    const total = await prisma.ip.count({ where });

    // Get IPs with their users
    const ips = await prisma.ip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        value: true,
        createdAt: true,
        isBanned: true,
        city: true,
        country: true,
        users: {
          select: {
            id: true,
            email: true,
            isBanned: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return res.status(200).json({
      ips,
      total,
      page,
      limit
    } satisfies TGetIpsResponseData);
  })
);

export default getIpsHandler;
