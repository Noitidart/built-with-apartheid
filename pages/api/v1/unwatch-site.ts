import { withPrisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const config = {
  runtime: 'edge'
};

const UnwatchRequestBodySchema = z.object({
  userId: z.string().min(1, 'user id is required'),
  websiteId: z.number().min(0, 'website id is required')
});

export async function unwatchSiteHandler(
  prisma: PrismaClient,
  req: NextRequest
) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405
    });
  }

  let unknownBody;
  try {
    unknownBody = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400
    });
  }

  const result = UnwatchRequestBodySchema.safeParse(unknownBody);
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: result.error.format()
      }),
      {
        status: 400
      }
    );
  }
  const body = result.data;

  const { websiteId, userId } = body;

  // Validate website exists
  const websiteExists = await prisma.website.findUnique({
    where: { id: websiteId }
  });
  if (!websiteExists) {
    return new Response(JSON.stringify({ error: 'Website not Found' }), {
      status: 404
    });
  }

  // Disconnect user from website watchers
  await prisma.website.update({
    where: { id: websiteId },
    data: {
      watchers: {
        disconnect: { id: userId }
      }
    }
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200
  });
}

export default withPrisma(unwatchSiteHandler);
