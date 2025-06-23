import {
  COMPANIES,
  getCompanyIdFromDescription,
  type CompanyId
} from '@/constants/companies';
import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { getOrCreateIp } from '@/lib/ip-utils.backend';
import { withPrisma } from '@/lib/prisma';
import type { TResponseDataWithErrors } from '@/lib/response/response-error-utils';
import { ensureHttpProtocol, getNormalizedHostname } from '@/lib/url';
import { assertIsScanInteraction } from '@/types/interaction';
import type { TScan } from '@/types/scan';
import type { TMe } from '@/types/user';
import type { TWebsite } from '@/types/website';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const CACHE_WINDOW_DAYS = 7;

// Select for scan interactions - only what this endpoint needs
const SCAN_INTERACTION_SELECT = {
  id: true,
  createdAt: true,
  type: true,
  websiteId: true,
  scan: {
    select: {
      changes: true
    }
  }
} satisfies Prisma.InteractionSelect;

// Type-safe scan interaction type derived from the select
type TScanInteractionBase = Prisma.InteractionGetPayload<{
  select: typeof SCAN_INTERACTION_SELECT;
}>;

// Ensure scan is non-nullable
type TScanInteraction = TScanInteractionBase & {
  type: 'SCAN';
  scan: NonNullable<TScanInteractionBase['scan']>;
};

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

// In case of error WHILE cached scan exists, will fallback to display cached
// scan ALONG WITH error. If no cached scan, then it just shows the error.
export type TScanResponseData =
  | TResponseDataWithErrors
  | {
      _errors?: TResponseDataWithErrors['_errors'];
      isCached?: boolean;
      scanInteraction: TScanInteraction;
      website: Pick<TWebsite, 'id' | 'hostname' | 'isMasjid'> & {
        _count: { watchers: number };
      };
      me: TMe;
    };

const SCAN_REQUEST_BODY_SCHEMA = z.object({
  url: z.string().min(1, 'URL is required'),
  force: z.boolean().optional().default(false)
});

export type TScanRequestBody = z.infer<typeof SCAN_REQUEST_BODY_SCHEMA>;

const newScanHandler = withPrisma(async function newScanHandler(
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

  const unknownBody = req.body;

  const result = SCAN_REQUEST_BODY_SCHEMA.safeParse(unknownBody);
  if (!result.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: result.error.flatten().fieldErrors
      }
    });
  }
  const body = result.data;

  const { url, force } = body;

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

  const hostname = getNormalizedHostname(url);

  const homepageUrl = ensureHttpProtocol(hostname);

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
      isMasjid: true,
      _count: {
        select: { watchers: true }
      }
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
    select: SCAN_INTERACTION_SELECT
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

      return res.status(200).json({
        _errors: shouldUndoForceScanAsWithinTenMinutesAgo
          ? {
              formErrors: ['scanErrors.freshScanDeniedAsLastScanIsTooRecent'],
              fieldErrors: {}
            }
          : undefined,
        isCached: true,
        scanInteraction: precedingScanInteraction,
        website,
        me
      } satisfies TScanResponseData);
    }
  }

  // Perform new scan
  let websiteHomepageHtml: string;
  try {
    websiteHomepageHtml = await fetchHtml(homepageUrl);
  } catch (error) {
    if (error instanceof FetchHtmlError) {
      // If network error and we have cached scan, fallback to cached version with error
      if (
        error.key === 'websiteErrors.serviceUnavailable' &&
        precedingScanInteraction
      ) {
        return res.status(200).json({
          _errors: {
            formErrors: ['websiteErrors.serviceUnavailable'],
            fieldErrors: {}
          },
          isCached: true,
          scanInteraction: precedingScanInteraction,
          website,
          me
        } satisfies TScanResponseData);
      }

      return sendFetchHtmlErrorResponse(res, error);
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
      ipId: userIp.id,
      scan: {
        create: {
          changes,
          websiteId: website.id,
          userId: userId
        }
      }
    },
    select: SCAN_INTERACTION_SELECT
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

  return res.status(200).json({
    isCached: false,
    scanInteraction,
    website,
    me
  } satisfies TScanResponseData);
});

function sendFetchHtmlErrorResponse(
  res: NextApiResponse,
  error: FetchHtmlError
): void {
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
    'requestErrors.serviceUnavailable': 424,
    'websiteErrors.serviceUnavailable': 424
  };

  if (error.key in statusCodeMap === false) {
    console.error('getFetchHtmlErrorResponse: Got unknown error key', {
      error
    });

    throw error;
  }

  const statusCode = statusCodeMap[error.key];

  res.status(statusCode).json({
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
  });
}

class FetchHtmlError extends Error {
  public blockRetryUntilDate?: Date;

  constructor(
    public key:
      | 'cfBrowserRendering.browserInterrupted'
      | 'cfBrowserRendering.creationTimeout'
      | 'requestErrors.networkError'
      | 'requestErrors.rateLimitExceeded'
      | 'requestErrors.serviceUnavailable'
      | 'websiteErrors.serviceUnavailable',
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
    } else if (firstError?.code === 5006) {
      throw new FetchHtmlError('websiteErrors.serviceUnavailable');
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
  scanInteraction: TScanInteraction;
  precedingScanInteraction: TScanInteraction | null;
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
  scanInteraction: TScanInteraction;
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
        if (inputs.scanInteraction.websiteId === null) {
          console.error('Error data', {
            scanInteraction: inputs.scanInteraction
          });

          throw new Error('websiteId is null');
        }

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
  scanInteraction: TScanInteraction;
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

export default newScanHandler;
