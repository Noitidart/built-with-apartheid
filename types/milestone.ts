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

export function isMilestoneDataOfType<
  T extends PrismaJson.TMilestoneData['type']
>(
  data: PrismaJson.TMilestoneData,
  type: T
): data is Extract<PrismaJson.TMilestoneData, { type: T }> {
  return data.type === type;
}

export function assertIsMilestoneDataOfType<
  T extends PrismaJson.TMilestoneData['type']
>(
  data: PrismaJson.TMilestoneData,
  type: T
): asserts data is Extract<PrismaJson.TMilestoneData, { type: T }> {
  if (data.type !== type) {
    console.error(`This milestone data is not a ${type} type`, { data });
    throw new Error(
      `This milestone data is not a ${type} type. This is a bug.`
    );
  }
}
