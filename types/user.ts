import type { TWebsite } from '@/types/website';
import type { User } from '@prisma/client';

export type TUser = User;

export type TMe = Pick<TUser, 'id' | 'email' | 'isMod'> & {
  isAuthenticated: boolean;
  watchedWebsites: Array<Pick<TWebsite, 'id' | 'hostname'>>;
};
