import { COMPANIES, type CompanyId } from '@/constants/companies';
import {
  isHumanInteraction,
  TIMELINE_INTERACTION_SELECT,
  type TTimelineInteraction
} from '@/constants/timeline';
import { withPrisma } from '@/lib/prisma';
import { isScanInteraction, type TInteraction } from '@/types/interaction';
import type { TUser } from '@/types/user';
import type { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export const config = {
  runtime: 'edge'
};

const TimelineRequestQuerySchema = z.object({
  websiteId: z.string().transform((val) => parseInt(val, 10))
});

export type TTimelineResponseData = {
  /** "Timeline Users" - A map of user metadata for the given timeline. */
  users: Record<TUser['id'], { number: number; type: 'curious' | 'concerned' }>;

  /** "Timeline Scans" - A map of scan interaction id to the scan metadata for the given timeline. */
  scans: Record<
    TTimelineInteraction['id'],
    {
      number: number;
    }
  >;

  /** "Timeline Interactions" - A timeline is defined as a list of interaction for a given website. This currently holds all the interactions, there is no pagination. */
  interactions: TTimelineInteraction[];

  /** "Timeline Companies" - A list of history of this website with all companies we scan for. */
  companies: Array<TTimelineCompany>;
};

async function getTimelineHandler(prisma: PrismaClient, req: NextRequest) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405
    });
  }

  const query = Object.fromEntries(req.nextUrl.searchParams);
  const result = TimelineRequestQuerySchema.safeParse(query);
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid website ID',
        details: result.error.format()
      }),
      { status: 400 }
    );
  }
  const { websiteId } = result.data;

  const timelineInteractions = await prisma.interaction.findMany({
    where: {
      websiteId
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: TIMELINE_INTERACTION_SELECT
  });

  const timelineInteractionsByNewestFirst = timelineInteractions;
  const timelineInteractionsByOldestFirst = timelineInteractionsByNewestFirst
    .slice()
    .reverse();

  return new Response(
    JSON.stringify({
      users: buildTimelineUsers({
        timelineInteractionsByOldestFirst
      }),
      scans: buildTimelineScans({
        timelineInteractionsByOldestFirst
      }),
      interactions: timelineInteractions,
      companies: buildTimelineCompanies({
        timelineInteractionsByOldestFirst
      })
    } satisfies TTimelineResponseData),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

function buildTimelineUsers(inputs: {
  timelineInteractionsByOldestFirst: TTimelineInteraction[];
}): TTimelineResponseData['users'] {
  const curiousUsers = new Set<TUser['id']>();
  const concernedUsers = new Set<TUser['id']>();

  for (const interaction of inputs.timelineInteractionsByOldestFirst) {
    if (!isHumanInteraction(interaction)) {
      continue;
    }

    if (interaction.type === 'POST') {
      curiousUsers.delete(interaction.userId);
      // Set maintains insertion order so adding it again will not change the
      // order when we turn it into an array.
      concernedUsers.add(interaction.userId);
    } else if (interaction.type === 'SCAN') {
      if (concernedUsers.has(interaction.userId)) {
        // User is already concerned meaning he has posted, so he's not just
        // curious he is concerned.
        continue;
      }

      curiousUsers.add(interaction.userId);
    }
  }

  const timelineUsers: TTimelineResponseData['users'] = {};

  Array.from(curiousUsers).forEach(function addCuriousUserToMap(userId, index) {
    timelineUsers[userId] = {
      type: 'curious',
      number: index + 1
    };
  });

  Array.from(concernedUsers).forEach(function addConcernedUserToMap(
    userId,
    index
  ) {
    timelineUsers[userId] = {
      type: 'concerned',
      number: index + 1
    };
  });

  return timelineUsers;
}

function buildTimelineScans(inputs: {
  timelineInteractionsByOldestFirst: TTimelineInteraction[];
}): TTimelineResponseData['scans'] {
  const timelineScans: TTimelineResponseData['scans'] = {};

  const scanInteractions =
    inputs.timelineInteractionsByOldestFirst.filter(isScanInteraction);

  scanInteractions.forEach(function addScanToMap(interaction, index) {
    timelineScans[interaction.id] = {
      number: index + 1
    };
  });

  return timelineScans;
}

type TActiveInfection = {
  start: TInteraction['createdAt'];
  end: null;
};

type TResolvedInfection = {
  start: TInteraction['createdAt'];
  end: TInteraction['createdAt'];
};

// This should be `[] | [...TResolvedInfection[], TActiveInfection] | TResolvedInfection[]`
// but I'm not sure how to express that in TypeScript.
type TInfections = Array<TActiveInfection | TResolvedInfection>;

type TTimelineCompany = {
  id: CompanyId;
  infections: TInfections;
};

function buildTimelineCompanies(inputs: {
  timelineInteractionsByOldestFirst: TTimelineInteraction[];
}): TTimelineCompany[] {
  const timelineCompanies: TTimelineCompany[] = COMPANIES.map((company) => ({
    id: company.id,
    infections: [] as TInfections
  }));

  for (const interaction of inputs.timelineInteractionsByOldestFirst) {
    if (!isScanInteraction(interaction)) {
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

export default withPrisma(getTimelineHandler);
