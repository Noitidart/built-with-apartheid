import { isFirstScanMilestone, type TMilestone } from '@/types/milestone';
import type { TPost } from '@/types/post';
import type { TScan } from '@/types/scan';
import type { Interaction, InteractionType } from '@prisma/client';

export type TInteraction = Interaction;

// Ban-related interaction data types
export type TBannedUserInteractionData = {
  reason: string;
};

export type TUnbannedUserInteractionData = {
  reason: string;
};

export type TBannedIpsInteractionData = {
  reason: string;
};

export type TUnbannedIpsInteractionData = {
  reason: string;
};

// MOD_ADDED and MOD_REMOVED have no data
export type TModAddedInteractionData = null;
export type TModRemovedInteractionData = null;

declare global {
  namespace PrismaJson {
    type TInteractionData =
      | TBannedUserInteractionData
      | TUnbannedUserInteractionData
      | TBannedIpsInteractionData
      | TUnbannedIpsInteractionData
      | TModAddedInteractionData
      | TModRemovedInteractionData;
  }
}

export function assertIsScanInteraction<
  UInteraction extends Partial<TInteraction>,
  UScan extends Partial<TScan>
>(
  interaction: UInteraction & {
    scan: UScan | null;
  }
): asserts interaction is UInteraction & { type: 'SCAN'; scan: UScan } {
  if (interaction.type !== 'SCAN' || !interaction.scan) {
    console.error('This interaction does not have a scan', { interaction });
    throw new Error('This interaction does not have a scan. This is a bug.');
  }
}

export function isScanInteraction<
  UInteraction extends Partial<TInteraction>,
  UScan extends Partial<TScan>
>(
  interaction: UInteraction & { scan: UScan | null }
): interaction is UInteraction & {
  type: 'SCAN';
  scan: UScan;
} {
  return interaction.type === 'SCAN' && interaction.scan !== null;
}

export function assertIsMilestoneInteraction<
  UInteraction extends Partial<TInteraction>,
  UMilestone extends Partial<TMilestone>
>(
  interaction: UInteraction & { milestone: UMilestone | null }
): asserts interaction is UInteraction & {
  type: 'MILESTONE';
  milestone: UMilestone;
} {
  if (interaction.type !== 'MILESTONE' || !interaction.milestone) {
    console.error('This interaction does not have a milestone', {
      interaction
    });
    throw new Error(
      'This interaction does not have a milestone. This is a bug.'
    );
  }
}

export function isMilestoneInteraction<
  UInteraction extends Partial<TInteraction>,
  UMilestone extends Partial<TMilestone>
>(
  interaction: UInteraction & { milestone: UMilestone | null }
): interaction is UInteraction & {
  type: 'MILESTONE';
  milestone: UMilestone;
} {
  return interaction.type === 'MILESTONE' && interaction.milestone !== null;
}

export type TPostInteraction = TInteraction & {
  type: 'POST';
  userId: NonNullable<TInteraction['userId']>;
  post?: TPost;
};

export function isPostInteraction<UInteraction extends TPostInteraction>(
  interaction: UInteraction
): interaction is Exclude<UInteraction, 'type' | 'userId'> & {
  type: 'POST';
  userId: NonNullable<UInteraction['userId']>;
} {
  return interaction.type === 'POST' && interaction.userId !== null;
}

export function assertIsPostInteraction<
  UInteraction extends Pick<TInteraction, 'type' | 'userId'>
>(
  interaction: UInteraction
): asserts interaction is Exclude<UInteraction, 'type' | 'userId'> & {
  type: 'POST';
  userId: NonNullable<UInteraction['userId']>;
} {
  if (interaction.type !== 'POST' || !interaction.userId) {
    console.error('This interaction does not have a user', { interaction });
    throw new Error('This interaction does not have a user. This is a bug.');
  }
}

export function isFirstScanInteraction(interaction: {
  dataInteractionForMilestones: Array<Pick<TMilestone, 'data'>>;
}) {
  return interaction.dataInteractionForMilestones.some(isFirstScanMilestone);
}

// Master type guard with generics
export function isInteractionOfType<
  T extends Partial<TInteraction>,
  Type extends InteractionType
>(
  interaction: T,
  type: Type
): interaction is T & {
  type: Type;
  data: 'data' extends keyof T
    ? Type extends 'BANNED_USER'
      ? TBannedUserInteractionData
      : Type extends 'UNBANNED_USER'
        ? TUnbannedUserInteractionData
        : Type extends 'BANNED_IPS'
          ? TBannedIpsInteractionData
          : Type extends 'UNBANNED_IPS'
            ? TUnbannedIpsInteractionData
            : Type extends 'MOD_ADDED'
              ? null
              : Type extends 'MOD_REMOVED'
                ? null
                : Type extends 'MILESTONE'
                  ? TMilestone['data']
                  : T['data']
    : never;
  scan: Type extends 'SCAN'
    ? 'scan' extends keyof T
      ? NonNullable<T['scan']>
      : never
    : never;
  post: Type extends 'POST'
    ? 'post' extends keyof T
      ? NonNullable<T['post']>
      : never
    : never;
  milestone: Type extends 'MILESTONE'
    ? 'milestone' extends keyof T
      ? NonNullable<T['milestone']>
      : never
    : never;
} {
  return interaction.type === type;
}

// Convenience functions
export const isBannedUserInteraction = <T extends Partial<TInteraction>>(
  interaction: T
) => isInteractionOfType(interaction, 'BANNED_USER');

export const isModAddedInteraction = <T extends Partial<TInteraction>>(
  interaction: T
) => isInteractionOfType(interaction, 'MOD_ADDED');

export const isModRemovedInteraction = <T extends Partial<TInteraction>>(
  interaction: T
) => isInteractionOfType(interaction, 'MOD_REMOVED');

// For asserting relations exist
export function assertHasTargetUsers<T extends { targetUsers?: any }>(
  interaction: T
): asserts interaction is T & { targetUsers: Array<any> } {
  if (!interaction.targetUsers || !Array.isArray(interaction.targetUsers)) {
    throw new Error('Interaction missing targetUsers');
  }
}

export function assertHasTargetIps<T extends { targetIps?: any }>(
  interaction: T
): asserts interaction is T & { targetIps: Array<any> } {
  if (!interaction.targetIps || !Array.isArray(interaction.targetIps)) {
    throw new Error('Interaction missing targetIps');
  }
}
