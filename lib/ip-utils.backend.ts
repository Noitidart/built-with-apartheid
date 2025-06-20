import { getRequestIp } from '@/lib/cf-utils.backend';
import type { Ip, PrismaClient } from '@prisma/client';
import type { NextApiRequest } from 'next';

export async function getOrCreateIp(
  prisma: PrismaClient,
  req: NextApiRequest,
  userId?: string
): Promise<Ip> {
  const ipValue = getRequestIp(req);

  if (!ipValue) {
    throw new Error('Could not determine IP address');
  }

  // Try to find existing IP
  let ip = await prisma.ip.findUnique({
    where: { value: ipValue }
  });

  if (!ip) {
    // Create new IP record with CF metadata if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfProperties = (req as any).cf;

    ip = await prisma.ip.create({
      data: {
        value: ipValue,
        // Extract CF metadata if available
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
        isVerifiedBot: cfProperties?.botManagement?.verifiedBot || false,
        // Associate with user if provided
        users: userId ? { connect: { id: userId } } : undefined
      }
    });
  } else {
    // Update last seen and associate with user if provided
    ip = await prisma.ip.update({
      where: { id: ip.id },
      data: {
        updatedAt: new Date(),
        users: userId ? { connect: { id: userId } } : undefined
      }
    });
  }

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
