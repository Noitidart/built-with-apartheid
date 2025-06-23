import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getRequestIp } from '@/lib/cf-utils.backend';
import type { TMe } from '@/types/user';
import { isIpBanned } from '@/utils/ban';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireMod<T extends (...args: any[]) => any>(
  handler: (
    prisma: PrismaClient,
    req: NextApiRequest,
    res: NextApiResponse,
    me: TMe
  ) => ReturnType<T>
) {
  return async function requireModHandler(
    prisma: PrismaClient,
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    // Check if IP is banned
    const clientIp = getRequestIp(req);
    if (clientIp) {
      try {
        const ipBanned = await isIpBanned(clientIp);
        if (ipBanned) {
          return res.status(403).json({
            _errors: {
              formErrors: ['Your IP address has been banned'],
              fieldErrors: {}
            }
          });
        }
      } catch (error) {
        console.error('Failed to check IP ban status:', error);
        // Continue processing - don't block on KV errors
      }
    }

    const me = await getMeFromRefreshedToken({
      prisma,
      request: req,
      response: res
    });

    // User ban check is now handled in Next.js middleware

    if (!me.isMod) {
      return res.status(403).json({
        _errors: {
          formErrors: ['requestErrors.forbidden'],
          fieldErrors: {}
        }
      });
    }

    return handler(prisma, req, res, me);
  };
}
