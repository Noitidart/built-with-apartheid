import type { User } from '@prisma/client';

export type TUser = User;

export type TMe = Pick<TUser, 'id' | 'isMod'> & {
  // Authenticated users must have an email
  email: NonNullable<TUser['email']>;
};
