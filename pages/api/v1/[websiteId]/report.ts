import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { withPrisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const querySchema = z.object({
  websiteId: z.string().transform(Number)
});

const bodySchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message too long'),
  scanId: z.number().optional(),
  reportType: z.string().min(1, 'Report type is required')
});

export type TReportRequestBody = {
  message: string;
  scanId?: number;
  reportType: string;
};

import type { TMe } from '@/types/user';

export type TReportResponseData = {
  me: TMe;
};

const newReportHandler = withPrisma(async function newReportHandler(
  prisma: PrismaClient,
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      _errors: {
        formErrors: ['requestErrors.methodNotAllowed'],
        fieldErrors: {}
      }
    });
  }

  const query = req.query;
  const unknownBody = req.body;
  const queryResult = querySchema.safeParse(query);

  if (!queryResult.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: queryResult.error.flatten().fieldErrors
      }
    });
  }

  const { websiteId } = queryResult.data;

  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: res
  });
  const userId = me.id;

  // Check if user is banned
  if (me.isBanned) {
    return res.status(403).json({
      _errors: {
        formErrors: ['requestErrors.forbidden'],
        fieldErrors: {}
      }
    });
  }

  // Get or create IP for the user
  const userIp = await getOrCreateIp(prisma, req, userId);

  const bodyResult = bodySchema.safeParse(unknownBody);

  if (!bodyResult.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: bodyResult.error.flatten().fieldErrors
      }
    });
  }

  const { message, scanId, reportType } = bodyResult.data;

  // Verify website exists
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true }
  });

  if (!website) {
    return res.status(404).json({
      _errors: {
        formErrors: ['requestErrors.notFound'],
        fieldErrors: { websiteId: ['requestErrors.notFound'] }
      }
    });
  }

  // If scanId is provided, verify scan exists and belongs to website
  if (scanId) {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      select: { id: true, websiteId: true }
    });
    if (!scan || scan.websiteId !== websiteId) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: { scanId: ['requestErrors.invalidScan'] }
        }
      });
    }
  }

  // Create the interaction and report
  await prisma.interaction.create({
    data: {
      type: 'REPORT',
      websiteId,
      userId,
      ipId: userIp.id,
      report: {
        create: {
          message: message.trim(),
          websiteId,
          scanId: scanId || null,
          reportType
        }
      }
    },
    select: {
      id: true,
      type: true,
      websiteId: true,
      userId: true
    }
  });

  return res.status(201).json({ me } satisfies TReportResponseData);
});

export default newReportHandler;
