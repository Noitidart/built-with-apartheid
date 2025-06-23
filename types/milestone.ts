import type { CompanyId } from '@/constants/companies';
import type { TWebsite } from '@/types/website';
import type { Milestone } from '@prisma/client';

export type TMilestone = Milestone;

export type TFirstScanMilestoneData = {
  type: 'first-scan';
};
export type TUserPromotedToConcernedMilestoneData = {
  type: 'user-promoted-to-concerned';
};
export type TCompanyAddedFirstTimeMilestoneData = {
  type: 'company-added-first-time';
  companyId: CompanyId;
};
export type TCompanyRemovedButHasOthersMilestoneData = {
  type: 'company-removed-but-has-others';
  companyId: CompanyId;
};
export type TCompanyRemovedAndNoOthersMilestoneData = {
  type: 'company-removed-and-no-others';
  companyId: CompanyId;
};
export type TCompanyAddedBackMilestoneData = {
  type: 'company-added-back';
  companyId: CompanyId;
};
declare global {
  namespace PrismaJson {
    type TMilestoneData =
      | TFirstScanMilestoneData
      | TUserPromotedToConcernedMilestoneData
      | TCompanyAddedFirstTimeMilestoneData
      | TCompanyRemovedButHasOthersMilestoneData
      | TCompanyRemovedAndNoOthersMilestoneData
      | TCompanyAddedBackMilestoneData;
  }
}

export function buildIsMilestoneDataOfType<
  T extends TMilestone['data']['type']
>(type: T) {
  return function isMilestoneDataOfType(
    data: TMilestone['data']
  ): data is Extract<TMilestone['data'], { type: T }> {
    return data.type === type;
  };
}

export function isMilestoneDataOfType<T extends TMilestone['data']['type']>(
  data: TMilestone['data'],
  type: T
): data is Extract<TMilestone['data'], { type: T }> {
  return data.type === type;
}

export function isFirstScanMilestone<
  UMilestone extends Pick<Milestone, 'data'>
>(
  milestone: UMilestone
): milestone is UMilestone & { data: TFirstScanMilestoneData } {
  return milestone.data.type === 'first-scan';
}

export function assertIsCompanyRemovedMilestones<
  UMilestone extends Pick<Milestone, 'data'> & { website?: UWebsite | null },
  UWebsite extends Partial<TWebsite>
>(
  milestones: UMilestone[]
): asserts milestones is Array<
  UMilestone & {
    data:
      | TCompanyRemovedButHasOthersMilestoneData
      | TCompanyRemovedAndNoOthersMilestoneData;
    website: NonNullable<UMilestone['website']>;
  }
> {
  if (!milestones.every(isCompanyRemovedMilestone)) {
    console.error('Not all milestones are company removed milestones', {
      milestones
    });
    throw new Error('Not all milestones are company removed milestones');
  }

  if (!milestones.every((milestone) => milestone.website != null)) {
    console.error('Not all milestones have a website', {
      milestones
    });
    throw new Error('Not all milestones have a website');
  }
}

export function isCompanyRemovedMilestone<
  UMilestone extends Pick<Milestone, 'data'>
>(
  milestone: UMilestone
): milestone is UMilestone & {
  data:
    | TCompanyRemovedButHasOthersMilestoneData
    | TCompanyRemovedAndNoOthersMilestoneData;
} {
  return (
    milestone.data.type === 'company-removed-but-has-others' ||
    milestone.data.type === 'company-removed-and-no-others'
  );
}
