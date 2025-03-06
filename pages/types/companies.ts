import ElementorLogo from "@/components/ElementorLogo";
import WixLogo from "@/components/WixLogo";

type Companies = { id: string; name: string; Logo: React.ComponentType };

export const COMPANIES = [
  {
    id: "wix" as const,
    name: "Wix",
    Logo: WixLogo,
  },
  {
    id: "elementor" as const,
    name: "Elementor",
    Logo: ElementorLogo,
  },
] satisfies Companies[];

export type CompanyId = (typeof COMPANIES)[number]["id"];
