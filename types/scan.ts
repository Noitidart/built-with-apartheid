import type { CompanyId } from '@/constants/companies';
import type { Scan } from '@prisma/client';

export type TScan = Scan;
export type TCompanyStatus = 'new' | 'removed' | 'still-present';

export const COMPANY_STATUS: Record<TCompanyStatus, TCompanyStatus> = {
  new: 'new',
  removed: 'removed',
  'still-present': 'still-present'
} as const;

declare global {
  namespace PrismaJson {
    // If company is not in the object, it means it was not detected in this scan and is still not detected.
    type TCompanyStatusChanges = Partial<Record<CompanyId, TCompanyStatus>>;
  }
}
