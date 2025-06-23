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

export type TUserWithIps = Pick<
  TUser,
  'id' | 'email' | 'isBanned' | 'createdAt'
> & {
  ips: Array<Pick<TIp, 'id' | 'value' | 'isBanned' | 'city' | 'country' | 'region' | 'regionCode' | 'timezone' | 'botScore' | 'isVerifiedBot' | 'updatedAt' | 'latitude' | 'longitude'> & {
    _count: {
      users: number;
    };
  }>;
  _count: {
    interactions: number;
  };
};

export type TGetUsersResponseData = {
  users: TUserWithIps[];
  total: number;
  page: number;
  limit: number;
};

const getUsersHandler = withPrisma(
  requireMod(async function getUsersHandler(
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
          { email: { contains: search, mode: 'insensitive' as const } },
          { id: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with their IPs
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        createdAt: true,
        isBanned: true,
        ips: {
          select: {
            id: true,
            value: true,
            isBanned: true,
            city: true,
            country: true,
            region: true,
            regionCode: true,
            timezone: true,
            botScore: true,
            isVerifiedBot: true,
            updatedAt: true,
            latitude: true,
            longitude: true,
            _count: {
              select: {
                users: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        },
        _count: {
          select: {
            interactions: true
          }
        }
      }
    });

    return res.status(200).json({
      users,
      total,
      page,
      limit
    } satisfies TGetUsersResponseData);
  })
);

export default getUsersHandler;
