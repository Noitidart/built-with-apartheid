import type { CompanyId } from "@/constants/companies";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const config = {
  runtime: "edge",
};

export type ScanResult = {
  url: string;
  detectedCompanyIds: CompanyId[];
  isProbablyMasjid: boolean;
};

const ScanRequestBodySchema = z.object({
  url: z.string().min(1, "URL is required"),
});

export type ScanRequestBody = z.infer<typeof ScanRequestBodySchema>;

export default async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  let unknownBody;
  try {
    unknownBody = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
    });
  }

  const result = ScanRequestBodySchema.safeParse(unknownBody);
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: result.error.format(),
      }),
      {
        status: 400,
      }
    );
  }
  const body = result.data;

  const { url } = body;

  // Prefix protocol if missing
  let targetUrl = url.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  const websiteHomepageHtml = await fetchHtml(targetUrl);
  const websiteHomepageHtmlLowerCase = websiteHomepageHtml.toLowerCase();

  const detectedCompanyIds: CompanyId[] = [];

  const hasElementor = websiteHomepageHtml.includes("/elementor");
  if (hasElementor) {
    detectedCompanyIds.push("elementor");
  }

  const hasWix =
    websiteHomepageHtml.includes("wix.com") ||
    websiteHomepageHtml.includes("Wix.com") ||
    websiteHomepageHtml.includes("_wixCssStates");
  if (hasWix) {
    detectedCompanyIds.push("wix");
  }

  const isProbablyMasjid =
    websiteHomepageHtmlLowerCase.includes("mosque") ||
    websiteHomepageHtmlLowerCase.includes("masjid") ||
    websiteHomepageHtmlLowerCase.includes("islamic") ||
    websiteHomepageHtmlLowerCase.includes("pray");

  return new Response(
    JSON.stringify({
      url: targetUrl,
      detectedCompanyIds,
      isProbablyMasjid,
      websiteHomepageHtml,
    }),
    { status: 200 }
  );
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.google.com/",
      "Cache-Control": "max-age=0",
      "Sec-Ch-Ua":
        '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"macOS"',
      "Upgrade-Insecure-Requests": "1",
    },
  });

  return await response.text();
}
