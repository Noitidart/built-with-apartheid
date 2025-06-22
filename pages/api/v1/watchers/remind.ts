import { withPrisma } from '@/lib/prisma';
import { emailReminderToWatchers } from '@/utils/email-watchers/emailReminderToWatchers';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const sendRemindersHandler = withPrisma(async function sendRemindersHandler(
  prisma: PrismaClient,
  req: NextApiRequest,
  res: NextApiResponse
) {
  //   if (req.method !== 'POST') {
  //     return res.status(405).json({
  //       _errors: {
  //         formErrors: ['requestErrors.methodNotAllowed'],
  //         fieldErrors: {}
  //       }
  //     });
  //   }

  //   const cronSecret = req.headers['x-cron-secret'];
  //   if (cronSecret !== process.env.CRON_SECRET) {
  //     return res.status(401).json({
  //       _errors: {
  //         formErrors: ['requestErrors.unauthorized'],
  //         fieldErrors: {}
  //       }
  //     });
  //   }

  await emailReminderToWatchers({ prisma });

  res.status(204).end();
});

export default sendRemindersHandler;
