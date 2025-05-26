import { Prisma } from '@prisma/client';

export const TIMELINE_INTERACTION_SELECT = {
  id: true,
  createdAt: true,
  type: true,
  userId: true,
  websiteId: true,
  scan: {
    select: {
      changes: true
    }
  },
  post: {
    select: {
      body: true
    }
  },
  milestone: {
    select: {
      data: true
    }
  }
} satisfies Prisma.InteractionSelect;

export type TTimelineInteraction = Prisma.InteractionGetPayload<{
  select: typeof TIMELINE_INTERACTION_SELECT;
}>;

export type TTimelineScanInteraction = Omit<
  TTimelineInteraction,
  'scan' | 'type'
> & {
  type: Extract<TTimelineInteraction['type'], 'SCAN'>;
  scan: NonNullable<TTimelineInteraction['scan']>;
};

export function isHumanInteraction<
  UInteraction extends Pick<TTimelineInteraction, 'type' | 'userId'>
>(
  interaction: UInteraction
): interaction is UInteraction & {
  type: Extract<UInteraction['type'], 'SCAN' | 'POST'>;
  userId: NonNullable<UInteraction['userId']>;
} {
  return interaction.type === 'SCAN' || interaction.type === 'POST';
}
