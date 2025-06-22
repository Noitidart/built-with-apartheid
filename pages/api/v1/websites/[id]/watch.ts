import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { withPrisma } from '@/lib/prisma';
import { castQueryParamAsNumber } from '@/lib/zod.frontend';
import type { TMe } from '@/types/user';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const BODY_SCHEMA = z.object({
  email: z.string().email().optional()
});

const BODY_SCHEMA_EMAIL_REQUIRED = BODY_SCHEMA.merge(
  z.object({
    email: z.string().email()
  })
);

const QUERY_SCHEMA = z.object({
  id: z.string().transform(castQueryParamAsNumber)
});

type TWatchResponseData = {
  action:
    | 'watch' // Start watching (includes setting email if user had no email)
    | 'watch-and-change-email' // Start watching AND change existing email
    | 'change-email' // Already watching, just update email
    | 'noop-already-watching'; // Already watching, no changes needed
  me?: TMe; // Include updated me when email changes
};

const watchWebsiteHandler = withPrisma(async function watchWebsiteHandler(
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

  const queryParseResult = QUERY_SCHEMA.safeParse(req.query);
  if (!queryParseResult.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: queryParseResult.error.flatten().fieldErrors
      }
    });
  }
  const { id: websiteId } = queryParseResult.data;

  const parseResult = BODY_SCHEMA.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: parseResult.error.flatten().fieldErrors
      }
    });
  }
  const { email } = parseResult.data;

  // Check if website exists
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true }
  });

  if (!website) {
    return res.status(404).json({
      _errors: {
        formErrors: ['requestErrors.notFound'],
        fieldErrors: {}
      }
    });
  }

  // Get user
  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: res
  });

  // Validate that we have an email (either from request or user account)
  if (!me.email) {
    // User has no email, so email in request body is required
    const requiredEmailParseResult = BODY_SCHEMA_EMAIL_REQUIRED.safeParse(
      req.body
    );
    if (!requiredEmailParseResult.success) {
      return res.status(400).json({
        _errors: {
          formErrors: ['requestErrors.badRequest'],
          fieldErrors: requiredEmailParseResult.error.flatten().fieldErrors
        }
      });
    }
  }

  // Get or create IP
  const userIp = await getOrCreateIp(prisma, req, me.id);

  // Determine action
  const isAlreadyWatching = me.watchedWebsites.some(
    function isWatchedWebsiteThisWebsite(watchedWebsite) {
      return watchedWebsite.id === websiteId;
    }
  );
  const isChangingEmail = email && email !== me.email;

  let action: TWatchResponseData['action'];
  if (isAlreadyWatching) {
    if (isChangingEmail) {
      action = 'change-email';
    } else {
      action = 'noop-already-watching';
    }
  } else {
    if (isChangingEmail && me.email) {
      action = 'watch-and-change-email';
    } else {
      action = 'watch';
    }
  }

  // Execute action
  switch (action) {
    case 'noop-already-watching':
      // No changes needed
      break;

    case 'change-email': {
      if (!email) {
        throw new Error('This is impossible, if got here, email is present');
      }
      // Just update the email
      await prisma.user.update({
        where: { id: me.id },
        data: { email }
      });
      break;
    }
    case 'watch':
    case 'watch-and-change-email':
      // Transaction to create watch and set email
      await prisma.$transaction(async function createWatchWithEmail(tx) {
        // Ensure user exists in DB (for anonymous users)
        await tx.user.upsert({
          where: { id: me.id },
          create: {
            id: me.id,
            ...(email && { email }),
            isMod: me.isMod
          },
          update: {
            // Update email if provided
            email: email || me.email
          }
        });

        // Connect user to website
        await tx.user.update({
          where: { id: me.id },
          data: {
            watchedWebsites: {
              connect: { id: websiteId }
            }
          }
        });

        // Create WATCHED interaction
        await tx.interaction.create({
          data: {
            type: 'WATCHED',
            userId: me.id,
            websiteId: websiteId,
            ipId: userIp.id,
            data: null
          }
        });
      });

      break;
  }

  return res.status(200).json({
    action,
    me: {
      ...me,
      email: email || me.email
    }
  });
});

export default watchWebsiteHandler;
