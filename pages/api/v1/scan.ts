import type { CompanyId } from '@/constants/companies';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

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

export type ScanResult = {
  url: string;
  detectedCompanyIds: CompanyId[];
  isProbablyMasjid: boolean;
};

const ScanRequestBodySchema = z.object({
  url: z.string().min(1, 'URL is required')
});

export type ScanRequestBody = z.infer<typeof ScanRequestBodySchema>;

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

  const { url } = body;

  // Prefix protocol if missing
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const websiteHomepageHtml = await fetchHtml(targetUrl);
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

  return new Response(
    JSON.stringify({
      url: targetUrl,
      detectedCompanyIds,
      isProbablyMasjid,
      websiteHomepageHtml
    }),
    { status: 200 }
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
