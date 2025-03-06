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
    }),
    { status: 200 }
  );
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}
