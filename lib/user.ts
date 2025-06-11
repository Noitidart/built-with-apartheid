import type { PrismaClient } from '@prisma/client';
import { User } from '@prisma/client';

export async function getUserByIdOrThrow(
  userId: string,
  prisma: PrismaClient
): Promise<User> {
  if (!userId) {
    throw new Error('UserId required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('Expected User not found');
  }

  return user;
}

export async function getUserByIdOrNull(
  userId: string,
  prisma: PrismaClient
): Promise<User | null> {
  if (!userId) {
    throw new Error('UserId required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  return user;
}
