import React from 'react';
import EthicalAlternativesButton from './EthicalAlternativesButton';
import LearnTmaButton from './LearnTmaButton';

interface ElementorArticleProps {
  isProbablyMasjid?: boolean;
}

const ElementorArticle: React.FC<ElementorArticleProps> = ({
  isProbablyMasjid
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 text-sm sm:text-base">
      {/* Main content - Header is already handled by CompanyList */}
      <div className="p-3 sm:p-6 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          You are using Elementor
        </h3>

        <p className="text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
          Elementor is an Israeli-owned WordPress page builder plugin.
          You&apos;re using it as your website&apos;s design system to create
          and edit pages with its drag-and-drop visual editor.
        </p>

        <div className="mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
            What this means for you:
          </h4>
          <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              Your WordPress site relies on Elementor for page design and layout
            </li>
            <li>
              Elementor adds significant code bloat that can slow down your
              website
            </li>
            <li>
              You&apos;re likely paying for Elementor Pro&apos;s annual
              subscription
            </li>
            <li>
              Your content remains in WordPress, but the design layer is
              Elementor-dependent
            </li>
            <li>Website updates and maintenance require Elementor knowledge</li>
          </ul>
        </div>

        <EthicalAlternativesButton
          companySlug="elementor"
          companyName="Elementor"
        />
      </div>

      {/* Masjid-specific section */}
      {isProbablyMasjid && (
        <div className="p-3 sm:p-6 bg-green-200 dark:bg-green-900 border-t border-green-100 dark:border-green-800">
          <h3 className="text-lg font-bold mb-2 sm:mb-3 text-green-800 dark:text-green-200">
            Special Recommendation for Masjid&apos;s
          </h3>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm">
            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
              The Masjid App: Better Than WordPress + Elementor
            </h4>

            <p className="text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              Replacing Elementor with The Masjid App gives your Islamic center
              purpose-built tools:
            </p>

            <ul className="list-disc list-outside pl-4 sm:pl-5 space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-gray-700 dark:text-gray-300">
              <li>
                Migration assistance to move your content from
                WordPress/Elementor
              </li>
              <li>
                No more plugin compatibility issues or WordPress security
                concerns
              </li>
              <li>
                Faster page load times without Elementor&apos;s heavy code
              </li>
              <li>
                Pre-built components specifically designed for Islamic centers
              </li>
              <li>No technical expertise needed to maintain your website</li>
            </ul>

            <div className="bg-green-200 dark:bg-green-900 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
              <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Built specifically for masjid&apos;s:
              </h5>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                {[
                  'Prayer Times Widget',
                  'Events Calendar',
                  'Dynamic Slideshows',
                  'Donation Processing',
                  'News & Announcements',
                  'Khutbah Archives',
                  'Ramadan Schedule',
                  'Community Directory'
                ].map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 mr-1 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
              Unlike WordPress with Elementor that requires constant updates and
              maintenance, The Masjid App handles all technical aspects for you.
              Your staff can focus on content, not technical issues, while
              automatically keeping your website current.
            </p>

            <LearnTmaButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementorArticle;
