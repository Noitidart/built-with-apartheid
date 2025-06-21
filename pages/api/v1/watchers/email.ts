import { withPrisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const emailWatchersTask = withPrisma(async function handleWatchersEmail(
  _prisma: PrismaClient,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cronSecret = req.headers['x-cron-secret'];
  const isCronRequest = cronSecret === process.env.CRON_SECRET;
  if (!isCronRequest) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  console.log('Email watchers cron executed');

  res.status(204).end();
});

export default emailWatchersTask;
