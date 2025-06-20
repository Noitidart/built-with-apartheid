import type { TInteraction } from '@/types/interaction';
import type { TIp } from '@/types/ip';
import type { TUser } from '@/types/user';
import type { Prisma } from '@prisma/client';

// Single type for ban interactions with all possible fields
export type TBanInteraction = Pick<
  TInteraction,
  'id' | 'type' | 'createdAt' | 'data'
> & {
  user: Pick<TUser, 'id' | 'email'> | null;
  ip: Pick<TIp, 'id' | 'value'> | null;
  targetUsers: Array<Pick<TUser, 'id' | 'email'>>;
  targetIps: Array<Pick<TIp, 'id' | 'value' | 'isBanned'>>;
};

// Prisma select constant for ban interactions
export const BAN_INTERACTION_SELECT = {
  id: true,
  type: true,
  createdAt: true,
  data: true,
  user: {
    select: {
      id: true,
      email: true
    }
  },
  ip: {
    select: {
      id: true,
      value: true
    }
  },
  targetUsers: {
    select: {
      id: true,
      email: true
    }
  },
  targetIps: {
    select: {
      id: true,
      value: true,
      isBanned: true
    }
  }
} satisfies Prisma.InteractionSelect;
