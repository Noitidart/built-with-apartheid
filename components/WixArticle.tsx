import React from 'react';
import CompanyArticleLayout from './CompanyArticleLayout';

interface WixArticleProps {
  isProbablyMasjid?: boolean;
  hostname?: string;
}

const WixArticle: React.FC<WixArticleProps> = ({ isProbablyMasjid, hostname }) => {
  return (
    <CompanyArticleLayout
      companyName="Wix"
      companySlug="wix"
      description="Wix is an Israeli-owned website builder and hosting platform. Your entire website runs on their infrastructure - including your content, hosting, domain connection, and design tools. They have full access to your private registration data and login geography. They also have full tracking data of your visitors."
      implications={[
        'Israeli company: Wix is headquartered in Tel Aviv and actively supports Israeli military operations',
        "Data collection for military use: Internal messages show Wix provided user data including emails, IP addresses, and payment information to Israeli Prime Minister's office upon request",
        'Surveillance partnership: Wix collaborated with Israeli government to screen websites for "Palestinian flags" and remove "pro-Hamas" content, demonstrating active participation in censorship',
        'International boycotts: Ireland has seen significant boycott campaigns, and Wix is listed on the official BDS (Boycott, Divestment, Sanctions) movement target list at bdsmovement.net',
        'Employee persecution: Wix fired Irish employee Courtney Carey for calling Israel a "terrorist state" and was ordered to pay €35,000 compensation for unfair dismissal',
        'Poor SEO performance: Only 1.4% of Wix sites get organic traffic vs 46.1% of WordPress sites',
        'Slow loading speeds: Wix sites load significantly slower due to code bloat and heavy JavaScript',
        'Hidden costs: Apps and features require expensive monthly add-ons beyond base pricing',
        'Template limitations: Cannot switch templates without rebuilding entire site',
        'Platform dependency: Impossible to export your content or migrate to another platform'
      ]}
      isProbablyMasjid={isProbablyMasjid}
      hostname={hostname}
      masjidSection={{
        subtitle:
          "The Masjid App: Optimized for Masjid's with Attention to the Ummah's Dignity Unlike Wix",
        description:
          'Eliminates every issue mentioned above. No Israeli data collection, no hidden costs, no technical maintenance required.',
        benefits: [
          'Complete self-updating system - no agency relationship needed',
          'Simple dashboard as easy as social media - your staff can handle everything',
          'All masjid features included - no hidden apps, add-ons, or gateways to setup',
          'Zero volunteer technical work required - everything runs automatically',
          'Complete privacy protection - your data stays private',
          'Modern WordPress with intuitive editing - no technical skills needed'
        ],
        features: [
          'Never Manually Update Website Again',
          'Hijri Centered',
          'Donation Processing',
          'Event Management',
          'Mobile App',
          'One-time Setup Forever'
        ],
        conclusion:
          'Unlike Wix where you need volunteers to maintain multiple systems and pay for endless add-ons, The Masjid App handles the full technical breadth of masjid needs automatically. Your team focuses on serving the community while our system automatically handles everything else.'
      }}
    />
  );
};

export default WixArticle;
