import type { User } from '@prisma/client';

export type TUser = User;

export type TMe = Pick<TUser, 'id' | 'email' | 'isMod'> & {
  isAuthenticated: boolean;
};
