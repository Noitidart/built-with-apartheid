// pages/api/v1/users/[userId].ts
import { withPrisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
// import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const config = {
  runtime: 'edge'
};
const UserRequestQuerySchema = z.object({
  userId: z.string()
});

async function getUserHandler(prisma: PrismaClient, req: NextRequest) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405
    });
  }

  const query = Object.fromEntries(req.nextUrl.searchParams);
  const result = UserRequestQuerySchema.safeParse(query);
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid user ID',
        details: result.error.format()
      }),
      { status: 400 }
    );
  }
  const { userId } = result.data;

  try {
    // Fetch user from your database (e.g., Prisma, MongoDB)
    const user = await prisma.user.findUnique({
      where: { id: String(userId) }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500
    });
  }
}

export default withPrisma(getUserHandler);
