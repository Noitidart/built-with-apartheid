import { COMPANIES } from '@/constants/companies';
import { COMPANY_STATUS } from '@/types/scan';
import type { TWebsite } from '@/types/website';
import type { PrismaClient } from '@prisma/client';

type TEngagementLevel = 'solo' | 'high' | 'inactive';

export type TWebsiteWithEngagement = Pick<TWebsite, 'id' | 'hostname'> & {
  postCount: number;
  uniquePosterCount: number;
  engagementLevel: TEngagementLevel;
  lastPostCreatedAt: Date | null;
  infected: boolean;
};

function buildInfectionWhereClause(): string {
  const companyIds = COMPANIES.map((company) => company.id);
  const infectedStatusList = [
    COMPANY_STATUS.new,
    COMPANY_STATUS['still-present']
  ]
    .map((status) => `'${status}'`)
    .join(', ');

  return companyIds
    .map(
      (companyId) => `ls.changes->>'${companyId}' IN (${infectedStatusList})`
    )
    .join(' OR ');
}

type TFindEngagementInputs = {
  prisma: PrismaClient;
  limit: number;
  sinceDate: Date;
};

type TEngagementQueryConfig = {
  engagementLevel: TEngagementLevel;
  whereClause: string;
  orderClause: string;
};

type TEngagementQueryOptions = {
  sinceDate: Date;
  limit: number;
};

function buildEngagementQuery(
  config: TEngagementQueryConfig,
  options?: TEngagementQueryOptions
): string {
  const sinceCondition = options?.sinceDate
    ? `AND p."createdAt" >= NOW() - INTERVAL '${Math.ceil(
        (new Date().getTime() - options.sinceDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )} days'`
    : '';

  return `
    WITH latest_scan AS (
      SELECT DISTINCT ON (s."websiteId")
        s."websiteId",
        s.changes
      FROM "Scan" s
      ORDER BY s."websiteId", s."createdAt" DESC
    ),
    oldest_scan AS (
      SELECT DISTINCT ON (s."websiteId")
        s."websiteId",
        s."createdAt" as "oldestScanDate"
      FROM "Scan" s
      ORDER BY s."websiteId", s."createdAt" ASC
    ),
    website_post_activity AS (
      SELECT 
        w.id,
        COUNT(p.id) as post_count,
        COUNT(DISTINCT p."userId") as unique_poster_count,
        MAX(p."createdAt") as last_post_at
      FROM "Website" w
      LEFT JOIN "Post" p ON w.id = p."websiteId" 
        ${sinceCondition}
      GROUP BY w.id
    )
    SELECT 
      w.id,
      w.hostname,
      COALESCE(wpa.post_count, 0)::int as "postCount",
      COALESCE(wpa.unique_poster_count, 0)::int as "uniquePosterCount",
      '${config.engagementLevel}' as "engagementLevel",
      wpa.last_post_at as "lastPostCreatedAt",
      CASE WHEN (${buildInfectionWhereClause()}) THEN true ELSE false END as "infected"
    FROM "Website" w
    INNER JOIN latest_scan ls ON w.id = ls."websiteId"
    LEFT JOIN oldest_scan os ON w.id = os."websiteId"
    LEFT JOIN website_post_activity wpa ON w.id = wpa.id
    WHERE ${config.whereClause}
    ${config.orderClause}
    ${options?.limit ? `LIMIT ${options.limit}` : ''}
  `;
}

/**
 * Finds websites based on infection status.
 */
export async function findManyInfectedWebsites(
  prisma: PrismaClient,
  infected: boolean,
  limit = 10
): Promise<Pick<TWebsite, 'id' | 'hostname'>[]> {
  const whereClause = infected
    ? buildInfectionWhereClause()
    : `NOT (${buildInfectionWhereClause()})`;

  const query = `
    WITH latest_scan AS (
      SELECT DISTINCT ON (s."websiteId")
        s."websiteId",
        s.changes
      FROM "Scan" s
      ORDER BY s."websiteId", s."createdAt" DESC
    )
    SELECT 
      w.id,
      w.hostname
    FROM "Website" w
    INNER JOIN latest_scan ls ON w.id = ls."websiteId"
    WHERE ${whereClause}
    LIMIT ${limit}
  `;

  // Using $queryRawUnsafe because query contains dynamic string interpolation
  // (whereClause from buildInfectionWhereClause) rather than parameterized placeholders.
  // All interpolated values are controlled/calculated, not user input, so this is safe.
  return await prisma.$queryRawUnsafe<Pick<TWebsite, 'id' | 'hostname'>[]>(
    query
  );
}

/**
 * Finds solo engagement websites: Infected websites with exactly 1 unique
 * poster in recent period. Ordered by most recent post first.
 */
export async function findSoloWebsitesWithEngagement(
  inputs: TFindEngagementInputs
): Promise<TWebsiteWithEngagement[]> {
  const query = buildEngagementQuery(
    {
      engagementLevel: 'solo',
      whereClause: `(${buildInfectionWhereClause()}) AND COALESCE(wpa.unique_poster_count, 0) = 1`,
      orderClause: 'ORDER BY wpa.last_post_at DESC NULLS LAST'
    },
    {
      sinceDate: inputs.sinceDate,
      limit: inputs.limit
    }
  );

  // Using $queryRawUnsafe because query contains dynamic string interpolation
  // (recentDays, engagementLevel, etc.) rather than parameterized placeholders.
  // All interpolated values are controlled/calculated, not user input, so this is safe.
  return await inputs.prisma.$queryRawUnsafe<TWebsiteWithEngagement[]>(query);
}

/**
 * Finds high activity websites: Any infected website with >1 unique poster
 * in recent period. Ordered by most recent post first.
 */
export async function findHighActivityWebsitesWithEngagement(
  inputs: TFindEngagementInputs
): Promise<TWebsiteWithEngagement[]> {
  const query = buildEngagementQuery(
    {
      engagementLevel: 'high',
      whereClause: `(${buildInfectionWhereClause()}) AND COALESCE(wpa.unique_poster_count, 0) > 1`,
      orderClause: 'ORDER BY wpa.last_post_at DESC NULLS LAST'
    },
    {
      sinceDate: inputs.sinceDate,
      limit: inputs.limit
    }
  );

  // Using $queryRawUnsafe because query contains dynamic string interpolation
  // (recentDays, engagementLevel, etc.) rather than parameterized placeholders.
  // All interpolated values are controlled/calculated, not user input, so this is safe.
  return await inputs.prisma.$queryRawUnsafe<TWebsiteWithEngagement[]>(query);
}

/**
 * Finds inactive websites: Infected websites with 0 posts in recent period
 * AND first scan >7 days old. Ordered by oldest post first.
 */
export async function findInactiveWebsitesWithEngagement(
  inputs: TFindEngagementInputs
): Promise<TWebsiteWithEngagement[]> {
  const query = buildEngagementQuery(
    {
      engagementLevel: 'inactive',
      whereClause: `(${buildInfectionWhereClause()}) AND COALESCE(wpa.post_count, 0) = 0 AND os."oldestScanDate" < NOW() - INTERVAL '7 days'`,
      orderClause:
        'ORDER BY COALESCE(wpa.post_count, 0) ASC, wpa.last_post_at ASC NULLS FIRST'
    },
    {
      sinceDate: inputs.sinceDate,
      limit: inputs.limit
    }
  );

  // Using $queryRawUnsafe because query contains dynamic string interpolation
  // (recentDays, engagementLevel, etc.) rather than parameterized placeholders.
  // All interpolated values are controlled/calculated, not user input, so this is safe.
  return await inputs.prisma.$queryRawUnsafe<TWebsiteWithEngagement[]>(query);
}
