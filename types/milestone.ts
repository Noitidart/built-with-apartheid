import type { CompanyId } from '@/constants/companies';
import type { TUser } from '@/types/user';
import type { Milestone } from '@prisma/client';

export type TMilestone = Milestone;

declare global {
  namespace PrismaJson {
    type TMilestoneData =
      | {
          type: 'first-scan';
        }
      | {
          type: 'user-promoted-to-concerned';
          userId: TUser['id'];
        }
      | {
          type:
            | 'company-added-first-time'
            | 'company-removed-but-has-others'
            | 'company-removed-and-no-others'
            | 'company-added-back';
          companyId: CompanyId;
        };
  }
}
