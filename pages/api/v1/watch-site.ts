// pages/api/watch-site.ts
import { withPrisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/utils/user-utils';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const ScanRequestBodySchema = z.object({
  email: z.string().min(1, 'email is required'),

  websiteId: z.string().min(1, 'Website ID is required')
});

export async function watchSiteHandler(prisma: PrismaClient, req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405
    });
  }

  // Get userId from your existing system
  const userId = getCurrentUserId();
  let unknownBody;
  try {
    unknownBody = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400
    });
  }

  const result = ScanRequestBodySchema.safeParse(unknownBody);
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

  const { email, websiteId } = body;
  //   const { email, websiteId } = req.body;

  // Validate website exists
  const websiteExists = await prisma.website.findUnique({
    where: { id: websiteId }
  });
  if (!websiteExists) {
    return new Response(JSON.stringify({ error: 'Website not Found' }), {
      status: 404
    });
  }

  // Upsert user (create if doesn't exist)
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: email || undefined, // Only update email if provided
      isSubscribed: !!email // Subscribe only if email provided
    },
    create: {
      id: userId, // Using your NanoID
      email,
      isSubscribed: !!email
    }
  });

  // Connect user to website watchers
  await prisma.website.update({
    where: { id: websiteId },
    data: {
      watchers: {
        connect: { id: userId }
      }
    }
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200
  });
}

export default withPrisma(watchSiteHandler);
