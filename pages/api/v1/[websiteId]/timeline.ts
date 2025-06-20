import { COMPANIES, type CompanyId } from '@/constants/companies';
import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { withPrisma } from '@/lib/prisma';
import { assertNever } from '@/lib/typescript';
import type { TInteraction } from '@/types/interaction';
import type { TMilestone } from '@/types/milestone';
import type { TScan } from '@/types/scan';
import type { TMe } from '@/types/user';
import type { TWebsite } from '@/types/website';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const querySchema = z.object({
  websiteId: z.string().transform(Number)
}) satisfies z.ZodType<
  TTimelineRequestQuery,
  z.ZodTypeDef,
  { websiteId: string }
>;

type TTimelineRequestQuery = {
  websiteId: TWebsite['id'];
};

export type TActiveInfection = {
  start: TInteraction['createdAt'];
  end: null;
};

export type TResolvedInfection = {
  start: TInteraction['createdAt'];
  end: TInteraction['createdAt'];
};

// This should be `[] | [...TResolvedInfection[], TActiveInfection] | TResolvedInfection[]`
// but I'm not sure how to express that in TypeScript.
export type TInfections = Array<TActiveInfection | TResolvedInfection>;

export type TTimelineCompany = {
  id: CompanyId;
  infections: TInfections;
};

// Base type for common fields
type TTimelineInteractionBase = {
  id: number;
  createdAt: Date;
  websiteId: number;
};

// Discriminated union types for timeline interactions
export type TTimelineScanInteractionWithNumber = TTimelineInteractionBase & {
  type: 'SCAN';
  scan: {
    changes: TScan['changes'];
    number: number;
    userNumber: number;
  };
};

export type TTimelinePostInteractionWithNumber = TTimelineInteractionBase & {
  type: 'POST';
  post: {
    body: string;
    number: number;
    userNumber: number;
  };
};

export type TTimelineMilestoneInteraction = TTimelineInteractionBase & {
  type: 'MILESTONE';
  milestone: {
    id: number;
    data: TMilestone['data'];
    dataInteraction?: {
      id: number;
      type: string;
      createdAt: Date;
      userNumber: number; // Always non-null as milestones are triggered by human actions
    };
  };
};

export type TTimelineInteractionWithNumbers =
  | TTimelineScanInteractionWithNumber
  | TTimelinePostInteractionWithNumber
  | TTimelineMilestoneInteraction;

export type TTimelineResponseData = {
  /** "Timeline Interactions" - A timeline is defined as a list of interaction for a given website. This currently holds all the interactions, there is no pagination. */
  interactions: TTimelineInteractionWithNumbers[];

  /** "Timeline Companies" - A list of history of this website with all companies we scan for. */
  companies: TTimelineCompany[];

  /** "Me" - The current user's information */
  me: TMe;

  /** "Me User Number" - The current user's number for this timeline */
  meUserNumber: number;

  /** "Total Posters" - The total number of unique users who have posted */
  totalPosters: number;
};

const getTimelineHandler = withPrisma(async function getTimelineHandler(
  prisma: PrismaClient,
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      _errors: {
        formErrors: ['requestErrors.badRequest'],
        fieldErrors: result.error.flatten().fieldErrors
      }
    });
  }
  const { websiteId } = result.data;

  const me = await getMeFromRefreshedToken({
    prisma,
    request: req,
    response: res
  });
  const userId = me.id;

  // Run all queries in parallel using Promise.all
  const [interactions, userNumbers, scanNumbers, postNumbers, totalPosters] =
    await Promise.all([
      // Main interactions query with all needed fields
      prisma.interaction.findMany({
        where: { websiteId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          type: true,
          websiteId: true,
          userId: true, // Need this to look up user numbers
          scan: {
            select: {
              id: true,
              changes: true
            }
          },
          post: {
            select: {
              id: true,
              body: true
            }
          },
          milestone: {
            select: {
              id: true,
              data: true,
              dataInteraction: {
                select: {
                  id: true,
                  type: true,
                  createdAt: true,
                  userId: true // To show user number in milestones
                }
              }
            }
          }
        }
      }),

      // Get user numbers based on first interaction time
      prisma.$queryRaw<Array<{ userId: string; user_number: number }>>`
      WITH first_user_interactions AS (
        SELECT 
          "userId",
          MIN("createdAt") as first_interaction_at
        FROM "Interaction"
        WHERE "websiteId" = ${websiteId} AND "userId" IS NOT NULL
        GROUP BY "userId"
      )
      SELECT 
        "userId",
        -- Cast to int because ROW_NUMBER() returns bigint which becomes JS BigInt
        ROW_NUMBER() OVER (ORDER BY first_interaction_at)::int as user_number
      FROM first_user_interactions
    `,

      // Get scan numbers
      prisma.$queryRaw<Array<{ id: number; scan_number: number }>>`
      SELECT 
        id,
        -- Cast to int because ROW_NUMBER() returns bigint which becomes JS BigInt
        ROW_NUMBER() OVER (ORDER BY "createdAt")::int as scan_number
      FROM "Interaction"
      WHERE "websiteId" = ${websiteId} AND type = 'SCAN'
      ORDER BY "createdAt"
    `,

      // Get post numbers
      prisma.$queryRaw<Array<{ id: number; post_number: number }>>`
      SELECT 
        id,
        -- Cast to int because ROW_NUMBER() returns bigint which becomes JS BigInt
        ROW_NUMBER() OVER (ORDER BY "createdAt")::int as post_number
      FROM "Interaction"
      WHERE "websiteId" = ${websiteId} AND type = 'POST'
      ORDER BY "createdAt"
    `,

      // Get total posters count
      prisma.$queryRaw<Array<{ count: number }>>`
      SELECT 
        -- Cast to int because COUNT() returns bigint which becomes JS BigInt
        COUNT(DISTINCT "userId")::int as count
      FROM "Interaction"
      WHERE "websiteId" = ${websiteId} AND type = 'POST' AND "userId" IS NOT NULL
    `.then((result) => result[0]?.count || 0)
    ]);

  // Create lookup maps and find max user number
  const maxUserNumber = Math.max(
    ...userNumbers.map((timelineUser) => timelineUser.user_number)
  );
  const userNumberMap = new Map(
    userNumbers.map((timelineUser) => [
      timelineUser.userId,
      timelineUser.user_number
    ])
  );
  const scanNumberMap = new Map(
    scanNumbers.map((timelineScan) => [
      timelineScan.id,
      timelineScan.scan_number
    ])
  );
  const postNumberMap = new Map(
    postNumbers.map((timelinePost) => [
      timelinePost.id,
      timelinePost.post_number
    ])
  );

  // Calculate meUserNumber - use existing number or next available
  const meUserNumber = userNumberMap.get(userId) ?? maxUserNumber + 1;

  // Transform interactions to include user numbers and create discriminated union
  const transformedInteractions: TTimelineInteractionWithNumbers[] =
    interactions.map((interaction) => {
      switch (interaction.type) {
        case 'SCAN': {
          if (!interaction.scan) {
            throw new Error(
              `Scan interaction ${interaction.id} missing scan data`
            );
          }
          const scanNumber = scanNumberMap.get(interaction.id);
          if (!scanNumber) {
            throw new Error(
              `Scan number not found for interaction ${interaction.id}`
            );
          }

          if (!interaction.userId) {
            throw new Error(
              `Scan interaction ${interaction.id} missing userId`
            );
          }

          const userNumber = userNumberMap.get(interaction.userId);
          if (!userNumber) {
            throw new Error(
              `User number not found for userId ${interaction.userId}`
            );
          }

          if (interaction.websiteId === null) {
            throw new Error('websiteId is null');
          }

          return {
            id: interaction.id,
            type: interaction.type,
            createdAt: interaction.createdAt,
            websiteId: interaction.websiteId,
            scan: {
              changes: interaction.scan.changes,
              number: scanNumber,
              userNumber
            }
          };
        }

        case 'POST': {
          if (!interaction.post) {
            throw new Error(
              `Post interaction ${interaction.id} missing post data`
            );
          }

          if (!interaction.userId) {
            throw new Error(
              `Post interaction ${interaction.id} missing userId`
            );
          }

          const postNumber = postNumberMap.get(interaction.id);
          if (!postNumber) {
            throw new Error(
              `Post number not found for interaction ${interaction.id}`
            );
          }
          const userNumber = userNumberMap.get(interaction.userId);
          if (!userNumber) {
            throw new Error(
              `User number not found for userId ${interaction.userId}`
            );
          }

          if (interaction.websiteId === null) {
            throw new Error('websiteId is null');
          }

          return {
            id: interaction.id,
            type: interaction.type,
            createdAt: interaction.createdAt,
            websiteId: interaction.websiteId,
            post: {
              body: interaction.post.body,
              number: postNumber,
              userNumber
            }
          };
        }

        case 'MILESTONE': {
          if (!interaction.milestone) {
            throw new Error(
              `Milestone interaction ${interaction.id} missing milestone data`
            );
          }

          if (interaction.websiteId === null) {
            throw new Error('websiteId is null');
          }

          let dataInteraction: TTimelineMilestoneInteraction['milestone']['dataInteraction'];

          if (interaction.milestone.dataInteraction) {
            const { userId } = interaction.milestone.dataInteraction;
            if (!userId) {
              throw new Error(
                `Milestone ${interaction.id} has dataInteraction without userId`
              );
            }
            const userNumber = userNumberMap.get(userId);
            if (!userNumber) {
              throw new Error(
                `User number not found for milestone dataInteraction userId ${userId}`
              );
            }
            dataInteraction = {
              ...interaction.milestone.dataInteraction,
              userNumber
            };
          } else {
            dataInteraction = undefined;
          }

          return {
            id: interaction.id,
            type: interaction.type,
            createdAt: interaction.createdAt,
            websiteId: interaction.websiteId,
            milestone: {
              id: interaction.milestone.id,
              data: interaction.milestone.data,
              dataInteraction
            }
          };
        }
        case 'MOD_ADDED':
        case 'MOD_REMOVED':
        case 'BANNED_USER':
        case 'UNBANNED_USER':
        case 'BANNED_IPS':
        case 'UNBANNED_IPS': {
          throw new Error(
            `Interaction type ${interaction.type} is not supported`
          );
        }
        default:
          assertNever(interaction.type);
      }
    });

  const timelineInteractionsByOldestFirst = transformedInteractions
    .slice()
    .reverse();

  return res.status(200).json({
    interactions: transformedInteractions,
    companies: buildTimelineCompanies({
      timelineInteractionsByOldestFirst
    }),
    me,
    meUserNumber,
    totalPosters
  } satisfies TTimelineResponseData);
});

function buildTimelineCompanies(inputs: {
  timelineInteractionsByOldestFirst: TTimelineInteractionWithNumbers[];
}): TTimelineCompany[] {
  const timelineCompanies: TTimelineCompany[] = COMPANIES.map((company) => ({
    id: company.id,
    infections: [] as TInfections
  }));

  for (const interaction of inputs.timelineInteractionsByOldestFirst) {
    if (interaction.type !== 'SCAN') {
      continue;
    }

    for (const company of timelineCompanies) {
      const companyStatusChange = interaction.scan.changes[company.id];
      const isDetectedInCurrentScan =
        companyStatusChange === 'new' ||
        companyStatusChange === 'still-present';

      const currentInfections = company.infections;
      const lastInfection = currentInfections[currentInfections.length - 1];
      const isLastInfectionActive = lastInfection && lastInfection.end === null;

      if (isDetectedInCurrentScan) {
        if (!isLastInfectionActive) {
          // Company detected and no active infection - start new active infection
          company.infections.push({
            start: interaction.createdAt,
            end: null
          });
        }
      } else {
        if (isLastInfectionActive) {
          // Company not detected but has active infection - end the infection
          // @ts-expect-error - we know that the last infection is active
          lastInfection.end = interaction.createdAt;
        }
      }
    }
  }

  return timelineCompanies;
}

export default getTimelineHandler;
