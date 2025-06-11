import { withPrisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

export const config = {
  runtime: 'edge'
};
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function handleTrigger(prisma: PrismaClient) {
  const unethicalSites = await prisma.website.findMany({
    where: { isUnethical: true },
    include: {
      watchers: true
    }
  });

  for (const site of unethicalSites) {
    console.log(site.hostname);
    const recipients = site.watchers
      .filter((w) => w.email)
      .map((w) => ({
        email: w.email,
        userName: 'ethical user'
      }));
    console.log(recipients);
    if (recipients.length === 0) continue;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/batch-email`, {
        recipients,
        siteUrl: site.hostname
      });
      if (response.status == 200) {
        console.log('ok');
      }
      //   console.log(response.data);
    } catch (error) {
      if (error instanceof Error) {
        console.log(`Error: ${error.message}`);
      }
    }
  }

  return new Response('Emails attempted successfully', { status: 200 });
}

export default withPrisma(handleTrigger);
