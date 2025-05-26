import React from 'react';
import CompanyArticleLayout from './CompanyArticleLayout';

interface WixArticleProps {
  isProbablyMasjid?: boolean;
}

const WixArticle: React.FC<WixArticleProps> = ({ isProbablyMasjid }) => {
  return (
    <CompanyArticleLayout
      companyName="Wix"
      companySlug="wix"
      description="Wix is an Israeli-owned website builder and hosting platform. Your entire website runs on their infrastructure - including your content, hosting, domain connection, and design tools."
      implications={[
        'Wix controls your entire website infrastructure',
        'Limited SEO capabilities compared to other platforms',
        'Vendor lock-in makes it difficult to migrate your content later',
        'Performance limitations that can affect page load speeds',
        'Monthly subscription fees go to an Israeli company'
      ]}
      isProbablyMasjid={isProbablyMasjid}
      masjidSection={{
        title: "Special Recommendation for Masjid's",
        subtitle: 'The Masjid App: Complete Solution for Islamic Centers',
        description:
          "Moving from Wix to The Masjid App provides your Islamic center with a platform specifically designed for masjid's:",
        benefits: [
          'Complete migration assistance from Wix to an ethical platform',
          'Prayer times that automatically adjust for your location',
          'Built-in donation system designed for Islamic organizations',
          'Events calendar with recurring events for classes and halaqas',
          'Content management system that staff can easily update'
        ],
        features: [
          'Prayer Times Widget',
          'Events Calendar',
          'Dynamic Slideshows',
          'Zakat Calculator',
          'Donation Processing',
          'News & Announcements',
          'Khutbah Archives',
          'Ramadan Schedule Generator'
        ],
        conclusion:
          'Unlike Wix, The Masjid App keeps your website in sync automatically without requiring technical volunteers. Your staff can update content through a simple interface, and changes reflect across all platforms instantly.'
      }}
    />
  );
};

export default WixArticle;
