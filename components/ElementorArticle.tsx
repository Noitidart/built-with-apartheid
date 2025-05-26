import React from 'react';
import CompanyArticleLayout from './CompanyArticleLayout';

interface ElementorArticleProps {
  isProbablyMasjid?: boolean;
}

const ElementorArticle: React.FC<ElementorArticleProps> = ({
  isProbablyMasjid
}) => {
  return (
    <CompanyArticleLayout
      companyName="Elementor"
      companySlug="elementor"
      description="Elementor is an Israeli-owned WordPress page builder plugin. You're using it as your website's design system to create and edit pages with its drag-and-drop visual editor."
      implications={[
        'Your WordPress site relies on Elementor for page design and layout',
        'Elementor adds significant code bloat that can slow down your website',
        "You're likely paying for Elementor Pro's annual subscription",
        'Your content remains in WordPress, but the design layer is Elementor-dependent',
        'Website updates and maintenance require Elementor knowledge'
      ]}
      isProbablyMasjid={isProbablyMasjid}
      masjidSection={{
        title: "Special Recommendation for Masjid's",
        subtitle: 'The Masjid App: Better Than WordPress + Elementor',
        description:
          'Replacing Elementor with The Masjid App gives your Islamic center purpose-built tools:',
        benefits: [
          'Migration assistance to move your content from WordPress/Elementor',
          'No more plugin compatibility issues or WordPress security concerns',
          "Faster page load times without Elementor's heavy code",
          'Pre-built components specifically designed for Islamic centers',
          'No technical expertise needed to maintain your website'
        ],
        features: [
          'Prayer Times Widget',
          'Events Calendar',
          'Dynamic Slideshows',
          'Donation Processing',
          'News & Announcements',
          'Khutbah Archives',
          'Ramadan Schedule',
          'Community Directory'
        ],
        conclusion:
          'Unlike WordPress with Elementor that requires constant updates and maintenance, The Masjid App handles all technical aspects for you. Your staff can focus on content, not technical issues, while automatically keeping your website current.'
      }}
    />
  );
};

export default ElementorArticle;
