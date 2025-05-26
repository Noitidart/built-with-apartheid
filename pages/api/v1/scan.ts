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
import prisma from '@/lib/prisma';
import { ensureHttpProtocol, getNormalizedHostname } from '@/lib/url';
import { assertIsScanInteraction } from '@/types/interaction';
import type { TScan } from '@/types/scan';
import type { TWebsite } from '@/types/website';
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

export type TScanResponseData = {
  isCached?: boolean;
  scanInteraction: TTimelineScanInteraction;
  website: Pick<TWebsite, 'id' | 'hostname' | 'isMasjid'>;
};

const ScanRequestBodySchema = z.object({
  url: z.string().min(1, 'URL is required'),
  force: z.boolean().optional().default(false),
  userId: z.string().min(1, 'User ID is required')
});

export type TScanRequestBody = z.infer<typeof ScanRequestBodySchema>;

export default async function handler(req: NextRequest) {
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

  // Check if we can return cached scan
  if (!force && precedingScanInteraction) {
    const cacheWindowStart = new Date();
    cacheWindowStart.setDate(cacheWindowStart.getDate() - CACHE_WINDOW_DAYS);

    const isPrecedingScanCreatedAfterCacheWindowStart =
      precedingScanInteraction.createdAt > cacheWindowStart;
    if (isPrecedingScanCreatedAfterCacheWindowStart) {
      // Yes, we can use the cached scan as it is within the cache window and we
      // aren't forcing a scan.

      return new Response(
        JSON.stringify({
          isCached: true,
          scanInteraction: precedingScanInteraction,
          website
        } satisfies TScanResponseData),
        { status: 200 }
      );
    }
  }

  // Perform new scan
  const websiteHomepageHtml = await fetchHtml(homepageUrl);
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
      scanInteraction,
      precedingScanInteraction
    }),
    maybeCreateCompanyAddedMilestone({
      scanInteraction
    }),
    maybeCreateCompanyRemovedMilestone({
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

async function fetchHtml(url: string): Promise<string> {
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!cfApiToken || !cfAccountId) {
    throw new Error('Cloudflare API credentials not configured');
  }

  const response = await fetch(
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} ${errorText}`);
  }

  const result = (await response.json()) as TCloudflareBrowserRenderingResponse;

  if (!result.success) {
    throw new Error(`Cloudflare API error: ${result.errors.join(', ')}`);
  }

  return result.result;
}

async function maybeCreateFirstScanMilestone(inputs: {
  scanInteraction: TTimelineScanInteraction;
  precedingScanInteraction: TTimelineScanInteraction | null;
}) {
  if (inputs.precedingScanInteraction) {
    return;
  }

  await prisma.interaction.create({
    data: {
      type: 'MILESTONE',
      websiteId: inputs.scanInteraction.websiteId,
      milestone: {
        create: {
          websiteId: inputs.scanInteraction.websiteId,
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
        const pastNewDetection = await prisma.scan.findFirst({
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

        await prisma.interaction.create({
          data: {
            type: 'MILESTONE',
            websiteId: inputs.scanInteraction.websiteId,
            milestone: {
              create: {
                websiteId: inputs.scanInteraction.websiteId,
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
    await prisma.interaction.create({
      data: {
        type: 'MILESTONE',
        websiteId: inputs.scanInteraction.websiteId,
        milestone: {
          create: {
            websiteId: inputs.scanInteraction.websiteId,
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
