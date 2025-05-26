import ElementorArticle from '@/components/ElementorArticle';
import ElementorLogo from '@/components/ElementorLogo';
import WixArticle from '@/components/WixArticle';
import WixLogo from '@/components/WixLogo';

type Companies = {
  id: string;
  name: string;
  Logo: React.ComponentType;
  Article: React.ComponentType<{
    isProbablyMasjid?: boolean;
    isExpanded: boolean;
    toggleExpanded: () => void;
  }>;
};

export const COMPANIES = [
  {
    id: 'wix' as const,
    name: 'Wix',
    Logo: WixLogo,
    Article: WixArticle
  },
  {
    id: 'elementor' as const,
    name: 'Elementor',
    Logo: ElementorLogo,
    Article: ElementorArticle
  }
] satisfies Companies[];

export type TCompanyDescription = (typeof COMPANIES)[number];
export type TCompanyId = TCompanyDescription['id'];
export type CompanyId = (typeof COMPANIES)[number]['id'];

export function getCompanyIdFromDescription(
  companyDescription: TCompanyDescription
) {
  return companyDescription.id;
}
