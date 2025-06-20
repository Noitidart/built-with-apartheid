import { getRequestIp } from '@/lib/cf-utils.backend';
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfProperties = (req as any).cf;

  console.log({ cfProperties, reqKeys: Object.keys(req) });

  const commonData = {
    city: cfProperties?.city || null,
    country: cfProperties?.country || null,
    latitude: cfProperties?.latitude || null,
    longitude: cfProperties?.longitude || null,
    postalCode: cfProperties?.postalCode || null,
    metroCode: cfProperties?.metroCode || null,
    region: cfProperties?.region || null,
    regionCode: cfProperties?.regionCode || null,
    timezone: cfProperties?.timezone || null,
    botScore: cfProperties?.botManagement?.score || null,
    isVerifiedBot: cfProperties?.botManagement?.verifiedBot || false
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
