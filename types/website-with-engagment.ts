import { COMPANIES } from '@/constants/companies';
import { assertNever } from '@/lib/typescript';
import { COMPANY_STATUS } from '@/types/scan';
import type { TWebsite } from '@/types/website';
import type { PrismaClient } from '@prisma/client';

type TEngagementLevel = 'low' | 'high';

export type TWebsiteWithEngagement = Pick<TWebsite, 'id' | 'hostname'> & {
  postCount: number;
  uniquePosterCount: number;
  engagementScore: number;
  engagementLevel: TEngagementLevel;
  lastPostCreatedAt: Date | null;
};

/**
 * - 'engagement-score-high-to-low': Order by engagement score (highest first), then by most recent post
 * - 'engagement-score-low-to-high': Order by engagement score (lowest first), then by oldest post
 */
type TOrderBy = 'engagement-score-high-to-low' | 'engagement-score-low-to-high';

/**
 * Calculate engagement score based on posts and unique posters
 * Formula: unique_posters * 3 + recent_posts
 * Unique posters are weighted 3x more than total posts to prioritize community diversity
 */
function calculateEngagementScore({
  uniquePosters = 0,
  recentPosts = 0
}: {
  uniquePosters?: number;
  recentPosts?: number;
}): number {
  return uniquePosters * 3 + recentPosts;
}

/**
 * Build SQL formula for engagement score calculation
 */
function calculateEngagementScoreSQL(
  uniquePostersColumn: string,
  recentPostsColumn: string
): string {
  return `(${uniquePostersColumn} * 3 + ${recentPostsColumn})`;
}

/**
 * Maximum engagement score to be considered "low engagement"
 * Websites with scores above this are considered "high engagement"
 */
const DEFAULT_MAX_LOW_ENGAGEMENT_SCORE = calculateEngagementScore({
  uniquePosters: 0,
  recentPosts: 0
});

function buildInfectionWhereClause(): string {
  const companyIds = Object.keys(COMPANIES);
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

/**
 * Helper function to build the latest scans CTE
 */
function buildLatestScansCTE(): string {
  return `
    WITH latest_scans AS (
      SELECT DISTINCT ON (s."websiteId")
        s."websiteId",
        s.id as "scanId",
        s."createdAt" as "scanDate",
        s.changes
      FROM "Scan" s
      ORDER BY s."websiteId", s."createdAt" DESC
    )
  `;
}

/**
 * Helper function to build ORDER BY clause from simplified orderBy options
 */
function buildOrderByClause(orderBy?: TOrderBy): string {
  if (!orderBy) {
    return 'engagement_score DESC, last_post_at DESC NULLS LAST';
  }

  switch (orderBy) {
    case 'engagement-score-high-to-low':
      return 'engagement_score DESC, last_post_at DESC NULLS LAST';
    case 'engagement-score-low-to-high':
      return 'engagement_score ASC, last_post_at ASC NULLS LAST';
    default:
      assertNever(orderBy);
  }
}

type TFindManyWebsitesWithEngagmentInputs = {
  prisma: PrismaClient;
  limit: number;
  // From this date to now
  sinceDate: Date;
  orderBy: TOrderBy;
  randomize: boolean;
  infected: boolean;
  // Filter options
  filterByEngagement?: TEngagementLevel;
};

/**
 * Query websites with engagement metrics
 * Engagement score is calculated as: unique_posters * 3 + recent_posts
 */
export async function findManyWebsitesWithEngagement(
  inputs: TFindManyWebsitesWithEngagmentInputs
): Promise<TWebsiteWithEngagement[]> {
  // Calculate days since the sinceDate
  const recentDays = Math.ceil(
    (new Date().getTime() - inputs.sinceDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const maxLowEngagementScore = DEFAULT_MAX_LOW_ENGAGEMENT_SCORE;

  // Build WHERE conditions
  const whereConditions: string[] = [];

  if (inputs.infected) {
    whereConditions.push(buildInfectionWhereClause());
  }

  if (inputs.filterByEngagement) {
    const engagementCondition =
      inputs.filterByEngagement === 'low'
        ? `${calculateEngagementScoreSQL(
            'COALESCE(wpa.unique_poster_count, 0)',
            'COALESCE(wpa.post_count, 0)'
          )} <= ${maxLowEngagementScore}`
        : `${calculateEngagementScoreSQL(
            'COALESCE(wpa.unique_poster_count, 0)',
            'COALESCE(wpa.post_count, 0)'
          )} > ${maxLowEngagementScore}`;

    whereConditions.push(engagementCondition);
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const orderByClause = buildOrderByClause(inputs.orderBy);

  const engagementScoreSQL = calculateEngagementScoreSQL(
    'COALESCE(wpa.unique_poster_count, 0)',
    'COALESCE(wpa.post_count, 0)'
  );

  const randomOrderClause = inputs.randomize ? 'ORDER BY RANDOM()' : '';

  const query = `
    ${buildLatestScansCTE()},
    website_post_activity AS (
      SELECT 
        w.id,
        COUNT(p.id) as post_count,
        COUNT(DISTINCT p."userId") as unique_poster_count,
        MAX(p."createdAt") as last_post_at
      FROM "Website" w
      LEFT JOIN "Post" p ON w.id = p."websiteId" 
        AND p."createdAt" >= NOW() - INTERVAL '${recentDays} days'
      GROUP BY w.id
    ),
    websites_with_engagement AS (
      SELECT 
        w.id,
        w.hostname,
        w."isMasjid",
        w."createdAt",
        w."updatedAt",
        ls."scanId" as "latestScanId",
        ls."scanDate" as "latestScanDate",
        ls.changes as "latestScanChanges",
        COALESCE(wpa.post_count, 0)::int as "postCount",
        COALESCE(wpa.unique_poster_count, 0)::int as "uniquePosterCount",
        -- Engagement score: weight unique posters more heavily than total posts
        ${engagementScoreSQL}::int as "engagementScore",
        -- Engagement level based on score
        CASE
          WHEN ${engagementScoreSQL} <= ${maxLowEngagementScore} THEN 'low'
          ELSE 'high'
        END as "engagementLevel",
        CASE
          WHEN ${engagementScoreSQL} <= ${maxLowEngagementScore} THEN 'low'
          ELSE 'high'
        END as engagement_level,
        wpa.last_post_at as "lastPostCreatedAt",
        wpa.post_count,
        wpa.unique_poster_count,
        ${engagementScoreSQL} as engagement_score
      FROM "Website" w
      INNER JOIN latest_scans ls ON w.id = ls."websiteId"
      LEFT JOIN website_post_activity wpa ON w.id = wpa.id
      ${whereClause}
      ORDER BY ${orderByClause}
    )
    SELECT 
      id,
      hostname,
      "postCount",
      "uniquePosterCount",
      "engagementScore",
      "engagementLevel",
      "lastPostCreatedAt"
    FROM websites_with_engagement
    ${randomOrderClause}
    LIMIT ${inputs.limit}
  `;

  const result = await inputs.prisma.$queryRawUnsafe<TWebsiteWithEngagement[]>(
    query
  );

  return result;
}
