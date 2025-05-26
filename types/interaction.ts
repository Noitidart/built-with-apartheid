import type { TMilestone } from '@/types/milestone';
import type { TPost } from '@/types/post';
import type { TScan } from '@/types/scan';
import type { Interaction } from '@prisma/client';

export type TInteraction = Interaction;

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
