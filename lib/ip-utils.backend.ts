import { getRequestIp } from '@/lib/cf-utils.backend';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Ip, PrismaClient } from '@prisma/client';
import type { NextApiRequest } from 'next';

export async function getOrCreateIp(
  prisma: PrismaClient,
  req: NextApiRequest,
  userId: string
): Promise<Ip> {
  const ipValue = getRequestIp(req);

  if (!ipValue) {
    throw new Error('Could not determine IP address');
  }

  const { cf } = getCloudflareContext();

  const commonData = {
    city: cf?.city || null,
    country: cf?.country || null,
    latitude: cf?.latitude || null,
    longitude: cf?.longitude || null,
    postalCode: cf?.postalCode || null,
    metroCode: cf?.metroCode || null,
    region: cf?.region || null,
    regionCode: cf?.regionCode || null,
    timezone: cf?.timezone || null,
    botScore: cf?.botManagement?.score || null,
    isVerifiedBot: cf?.botManagement?.verifiedBot || false
  };
  const ip = await prisma.ip.upsert({
    where: { value: ipValue },
    create: {
      value: ipValue,
      ...commonData,
      // Associate with user - create user if doesn't exist
      users: {
        connectOrCreate: {
          where: { id: userId },
          create: { id: userId }
        }
      }
    },
    update: {
      updatedAt: new Date(),
      ...commonData,
      // Associate with user - create user if doesn't exist
      users: {
        connectOrCreate: {
          where: { id: userId },
          create: { id: userId }
        }
      }
    }
  });

  return ip;
}

export async function associateUserWithIp(
  prisma: PrismaClient,
  userId: string,
  ipId: number
): Promise<void> {
  // Create association if it doesn't exist
  await prisma.user.update({
    where: { id: userId },
    data: {
      ips: {
        connect: { id: ipId }
      }
    }
  });
}
