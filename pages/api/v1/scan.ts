import {
  COMPANIES,
  getCompanyIdFromDescription,
  type CompanyId
} from '@/constants/companies';
import {
  TIMELINE_INTERACTION_SELECT,
  type TTimelineScanInteraction
} from '@/constants/timeline';
import { getRequestIp } from '@/lib/cf-utils.backend';
import { withPrisma } from '@/lib/prisma';
import { ensureHttpProtocol, getNormalizedHostname } from '@/lib/url';
import { assertIsScanInteraction } from '@/types/interaction';
import type { TScan } from '@/types/scan';
import type { TWebsite } from '@/types/website';
import type { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const CACHE_WINDOW_DAYS = 7;

// Cloudflare Browser Rendering API Response Type
type TCloudflareBrowserRenderingSuccessResponse = {
  success: true;
  result: string;
  errors: [];
  messages: string[];
};

// Examples:
// {"success":false,"errors":[{"code":2001,"message":"Rate limit exceeded"}]}
type TCloudflareBrowserRenderingErrorResponse = {
  success: false;
  errors: [{ code: number; message: string }];
};

type TCloudflareBrowserRenderingResponse =
  | TCloudflareBrowserRenderingSuccessResponse
  | TCloudflareBrowserRenderingErrorResponse;

export const config = {
  runtime: 'edge'
};

type TScanResponseSuccessData = {
  _errors?: never;
  didDenyForceScanAsWithinTenMinutesAgo?: boolean;
  isCached?: boolean;
  scanInteraction: TTimelineScanInteraction;
  website: Pick<TWebsite, 'id' | 'hostname' | 'isMasjid'>;
};

export type TScanResponseData = TScanResponseSuccessData;

const ScanRequestBodySchema = z.object({
  url: z.string().min(1, 'URL is required'),
  force: z.boolean().optional().default(false),
  userId: z.string().min(1, 'User ID is required')
});

export type TScanRequestBody = z.infer<typeof ScanRequestBodySchema>;

async function newScanHandler(prisma: PrismaClient, req: NextRequest) {
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

  const { url, force, userId } = body;

  const hostname = getNormalizedHostname(url);

  const homepageUrl = ensureHttpProtocol(hostname);

  // Ensure user exists
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });

  // Get website id
  const website = await prisma.website.upsert({
    where: { hostname },
    update: {},
    create: {
      hostname,
      isMasjid: false // Will be updated after scan
    },
    select: {
      id: true,
      hostname: true,
      isMasjid: true
    }
  });

  // Get previous scan to determine company status changes
  const precedingScanInteraction = await prisma.interaction.findFirst({
    where: {
      websiteId: website.id,
      type: 'SCAN'
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: TIMELINE_INTERACTION_SELECT
  });

  if (precedingScanInteraction) {
    assertIsScanInteraction(precedingScanInteraction);
  }

  let shouldUndoForceScanAsWithinTenMinutesAgo = false;
  // Check if trying to force a scan even though one exists 10min ago
  if (force && precedingScanInteraction) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const isPrecedingScanCreatedWithinTenMinutesAgo =
      precedingScanInteraction.createdAt > tenMinutesAgo;
    if (isPrecedingScanCreatedWithinTenMinutesAgo) {
      shouldUndoForceScanAsWithinTenMinutesAgo = true;
    }
  }

  // Check if we can return cached scan
  if (
    precedingScanInteraction &&
    (!force || shouldUndoForceScanAsWithinTenMinutesAgo)
  ) {
    const cacheWindowStart = new Date();
    cacheWindowStart.setDate(cacheWindowStart.getDate() - CACHE_WINDOW_DAYS);

    const isPrecedingScanCreatedAfterCacheWindowStart =
      precedingScanInteraction.createdAt > cacheWindowStart;
    if (isPrecedingScanCreatedAfterCacheWindowStart) {
      // Yes, we can use the cached scan as it is within the cache window and we
      // aren't forcing a scan.

      return new Response(
        JSON.stringify({
          didDenyForceScanAsWithinTenMinutesAgo:
            shouldUndoForceScanAsWithinTenMinutesAgo,
          isCached: true,
          scanInteraction: precedingScanInteraction,
          website
        } satisfies TScanResponseData),
        { status: 200 }
      );
    }
  }

  // Perform new scan
  let websiteHomepageHtml: string;
  try {
    websiteHomepageHtml = await fetchHtml(homepageUrl);
  } catch (error) {
    if (error instanceof FetchHtmlError) {
      return getFetchHtmlErrorResponse(error);
    }

    throw error;
  }

  const websiteHomepageHtmlLowerCase = websiteHomepageHtml.toLowerCase();

  const detectedCompanyIds: CompanyId[] = [];

  const hasElementor = websiteHomepageHtml.includes('/elementor');
  if (hasElementor) {
    detectedCompanyIds.push('elementor');
  }

  const hasWix =
    websiteHomepageHtml.includes('wix.com') ||
    websiteHomepageHtml.includes('Wix.com') ||
    websiteHomepageHtml.includes('_wixCssStates');
  if (hasWix) {
    detectedCompanyIds.push('wix');
  }

  const isProbablyMasjid =
    websiteHomepageHtmlLowerCase.includes('mosque') ||
    websiteHomepageHtmlLowerCase.includes('masjid') ||
    websiteHomepageHtmlLowerCase.includes('islamic') ||
    websiteHomepageHtmlLowerCase.includes('pray');

  // Update website isMasjid status if it changed
  if (isProbablyMasjid !== website.isMasjid) {
    await prisma.website.update({
      where: { id: website.id },
      data: { isMasjid: isProbablyMasjid }
    });
    website.isMasjid = isProbablyMasjid;
  }

  // Build changes for current scan
  const changes: TScan['changes'] = {};
  for (const companyDescription of COMPANIES) {
    const companyId = companyDescription.id;

    const precedingCompanyStatus =
      precedingScanInteraction?.scan?.changes?.[companyId];
    const didPrecedingHaveInfection =
      precedingCompanyStatus === 'new' ||
      precedingCompanyStatus === 'still-present';
    const doesCurrentHaveInfection = detectedCompanyIds.includes(companyId);

    // If preceding HAD company infection, and current also HAS infection.
    const isInfectionStillPresent =
      didPrecedingHaveInfection && doesCurrentHaveInfection;
    // If preceding did NOT have company, and current HAS infection..
    const isInfectionNew =
      !didPrecedingHaveInfection && doesCurrentHaveInfection;
    // If preceding HAD company infection, and current does NOT have infection.
    const isInfectionRemoved =
      didPrecedingHaveInfection && !doesCurrentHaveInfection;
    // If preceding did NOT have company, and current does NOT have infection.
    const isAndWasNotInfected =
      !didPrecedingHaveInfection && !doesCurrentHaveInfection;

    if (isAndWasNotInfected) {
      // Don't add company
      continue;
    }
    if (isInfectionStillPresent) {
      changes[companyId] = 'still-present';
    } else if (isInfectionNew) {
      changes[companyId] = 'new';
    } else if (isInfectionRemoved) {
      changes[companyId] = 'removed';
    }
  }

  const scanInteraction = await prisma.interaction.create({
    data: {
      type: 'SCAN',
      websiteId: website.id,
      userId: userId,
      scan: {
        create: {
          changes,
          websiteId: website.id,
          userId: userId,
          userIp: getRequestIp(req) || 'unknown'
        }
      }
    },
    select: TIMELINE_INTERACTION_SELECT
  });

  assertIsScanInteraction(scanInteraction);
  if (precedingScanInteraction) {
    assertIsScanInteraction(precedingScanInteraction);
  }

  await Promise.all([
    maybeCreateFirstScanMilestone({
      prisma,
      scanInteraction,
      precedingScanInteraction
    }),
    maybeCreateCompanyAddedMilestone({
      prisma,
      scanInteraction
    }),
    maybeCreateCompanyRemovedMilestone({
      prisma,
      scanInteraction
    })
  ]);

  return new Response(
    JSON.stringify({
      isCached: false,
      scanInteraction,
      website: {
        id: website.id,
        hostname: website.hostname,
        isMasjid: isProbablyMasjid
      }
    } satisfies TScanResponseData),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

function getFetchHtmlErrorResponse(error: FetchHtmlError): Response {
  if (error instanceof FetchHtmlError === false) {
    console.error('getFetchHtmlErrorResponse: Got non-FetchHtmlError', {
      error
    });

    throw error;
  }

  const statusCodeMap: Record<FetchHtmlError['key'], number> = {
    'cfBrowserRendering.browserInterrupted': 422,
    'cfBrowserRendering.creationTimeout': 408,
    'requestErrors.networkError': 408,
    'requestErrors.rateLimitExceeded': 429,
    'requestErrors.serviceUnavailable': 424
  };

  if (error.key in statusCodeMap === false) {
    console.error('getFetchHtmlErrorResponse: Got unknown error key', {
      error
    });

    throw error;
  }

  const statusCode = statusCodeMap[error.key];

  return new Response(
    JSON.stringify({
      _errors: {
        formErrors: error.blockRetryUntilDate
          ? [
              [
                error.key,
                {
                  blockRetryUntilDate: error.blockRetryUntilDate.toISOString()
                }
              ]
            ]
          : [error.key],
        fieldErrors: {}
      }
    }),
    { status: statusCode, headers: { 'Content-Type': 'application/json' } }
  );
}

class FetchHtmlError extends Error {
  public blockRetryUntilDate?: Date;

  constructor(
    public key:
      | 'cfBrowserRendering.browserInterrupted'
      | 'cfBrowserRendering.creationTimeout'
      | 'requestErrors.networkError'
      | 'requestErrors.rateLimitExceeded'
      | 'requestErrors.serviceUnavailable',
    options?: { blockRetryForSeconds?: number }
  ) {
    super(key);
    this.name = 'FetchHtmlError';

    if (options?.blockRetryForSeconds) {
      this.blockRetryUntilDate = new Date(
        Date.now() + options.blockRetryForSeconds * 1000
      );
    }
  }
}

const DEFAULT_RETRY_BLOCK_FOR_SECONDS_IF_NO_RETRY_AFTER_HEADER = 30;

async function fetchHtml(url: string): Promise<string> {
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!cfApiToken || !cfAccountId) {
    throw new Error('Cloudflare API credentials not configured');
  }

  let response;
  try {
    response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/browser-rendering/content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfApiToken}`
        },
        body: JSON.stringify({ url })
      }
    );
  } catch (error) {
    console.error(
      'Got network error when making request to Cloudflare Browser Rendering API',
      { error }
    );
    // This is probably a network error on my server, not on Cloudflare Browser Rendering API server.
    throw new FetchHtmlError('requestErrors.networkError');
  }

  if (response.status === 429) {
    const retryAfterSecondsHeader = response.headers.get('Retry-After');
    const retryAfterSeconds = retryAfterSecondsHeader
      ? parseInt(retryAfterSecondsHeader)
      : DEFAULT_RETRY_BLOCK_FOR_SECONDS_IF_NO_RETRY_AFTER_HEADER;

    throw new FetchHtmlError('requestErrors.rateLimitExceeded', {
      blockRetryForSeconds: retryAfterSeconds
    });
  } else if (response.status >= 500) {
    throw new FetchHtmlError('requestErrors.serviceUnavailable');
  }

  const result = (await response.json()) as TCloudflareBrowserRenderingResponse;

  if (!result.success) {
    console.info(
      'Failure response data from Cloudflare Browser Rendering API',
      {
        responseStatus: response.status,
        result,
        responseHeaders: Object.fromEntries(response.headers.entries())
      }
    );

    // TODO: is looking at first error good enough?
    const firstError = result.errors[0];

    if (firstError?.code === 2001) {
      throw new FetchHtmlError('requestErrors.rateLimitExceeded', {
        blockRetryForSeconds:
          DEFAULT_RETRY_BLOCK_FOR_SECONDS_IF_NO_RETRY_AFTER_HEADER
      });
    } else if (
      firstError?.message?.toLowerCase().includes('execution context')
    ) {
      throw new FetchHtmlError('cfBrowserRendering.browserInterrupted');
    } else if (firstError?.message?.toLowerCase().includes('timeout')) {
      throw new FetchHtmlError('cfBrowserRendering.creationTimeout');
    } else {
      console.error('Unhandled Cloudflare Browser Rendering API error', {
        error: firstError
      });
      throw new Error('errors.unhandledError');
    }
  }

  return result.result;
}

async function maybeCreateFirstScanMilestone(inputs: {
  prisma: PrismaClient;
  scanInteraction: TTimelineScanInteraction;
  precedingScanInteraction: TTimelineScanInteraction | null;
}) {
  if (inputs.precedingScanInteraction) {
    return;
  }

  await inputs.prisma.interaction.create({
    data: {
      type: 'MILESTONE',
      websiteId: inputs.scanInteraction.websiteId,
      milestone: {
        create: {
          websiteId: inputs.scanInteraction.websiteId,
          dataInteractionId: inputs.scanInteraction.id,
          data: {
            type: 'first-scan'
          }
        }
      }
    }
  });
}

// Creates one of these potential milestones:
// 1. "company-added-back" - when a company is added back after being removed
// 2. "company-added-first-time" - when a company is added for the first time
async function maybeCreateCompanyAddedMilestone(inputs: {
  prisma: PrismaClient;
  scanInteraction: TTimelineScanInteraction;
}) {
  const newCompanyIds = COMPANIES.map(getCompanyIdFromDescription).filter(
    function hasNewInfectionForCompany(companyId) {
      return inputs.scanInteraction.scan.changes[companyId] === 'new';
    }
  );

  if (newCompanyIds.length === 0) {
    return;
  }

  await Promise.all([
    newCompanyIds.map(
      async function checkForPreviusNewDetectionForCompanyThenCreateMilestone(
        companyId
      ) {
        const pastNewDetection = await inputs.prisma.scan.findFirst({
          where: {
            websiteId: inputs.scanInteraction.websiteId,
            changes: {
              path: [companyId],
              equals: 'new'
            },
            createdAt: { lt: inputs.scanInteraction.createdAt }
          },
          select: { id: true }
        });

        await inputs.prisma.interaction.create({
          data: {
            type: 'MILESTONE',
            websiteId: inputs.scanInteraction.websiteId,
            milestone: {
              create: {
                websiteId: inputs.scanInteraction.websiteId,
                dataInteractionId: inputs.scanInteraction.id,
                data: {
                  type: pastNewDetection
                    ? 'company-added-back'
                    : 'company-added-first-time',
                  companyId
                }
              }
            }
          }
        });
      }
    )
  ]);
}

// Creates one of these potential milestones:
// 1. "company-removed-but-has-others" - when a company is removed but other companies are still present
// 2. "company-removed-and-no-others" - when a company is removed and no other companies are present
async function maybeCreateCompanyRemovedMilestone(inputs: {
  prisma: PrismaClient;
  scanInteraction: TTimelineScanInteraction;
}) {
  // Identify if any companies were newly removed
  const removedCompanyIds = COMPANIES.map(getCompanyIdFromDescription).filter(
    function hasRemovedInfectionForCompany(companyId) {
      return inputs.scanInteraction.scan.changes[companyId] === 'removed';
    }
  );

  if (removedCompanyIds.length === 0) {
    return;
  }

  const stilHasOtherCompanies = COMPANIES.map(getCompanyIdFromDescription).some(
    function isCompanyInfectionPresent(companyId) {
      return (
        inputs.scanInteraction.scan.changes[companyId] === 'new' ||
        inputs.scanInteraction.scan.changes[companyId] === 'still-present'
      );
    }
  );

  for (const companyId of removedCompanyIds) {
    await inputs.prisma.interaction.create({
      data: {
        type: 'MILESTONE',
        websiteId: inputs.scanInteraction.websiteId,
        milestone: {
          create: {
            websiteId: inputs.scanInteraction.websiteId,
            dataInteractionId: inputs.scanInteraction.id,
            data: {
              type: stilHasOtherCompanies
                ? 'company-removed-but-has-others'
                : 'company-removed-and-no-others',
              companyId
            }
          }
        }
      }
    });
  }
}

export default withPrisma(newScanHandler);
