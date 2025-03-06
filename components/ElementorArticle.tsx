import Link from "next/link";
import React from "react";
import EthicalAlternativesButton from "./EthicalAlternativesButton";

interface ElementorArticleProps {
  isProbablyMasjid?: boolean;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

const ElementorArticle: React.FC<ElementorArticleProps> = ({
  isProbablyMasjid = false,
  isExpanded,
  toggleExpanded,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Main content - Header is already handled by CompanyList */}
      <div className="p-6 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          You are using Elementor
        </h3>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Elementor is an Israeli-owned WordPress page builder plugin. You're
          using it as your website's design system to create and edit pages with
          its drag-and-drop visual editor.
        </p>

        <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
            What this means for you:
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              Your WordPress site relies on Elementor for page design and layout
            </li>
            <li>
              Elementor adds significant code bloat that can slow down your
              website
            </li>
            <li>
              You're likely paying for Elementor Pro's annual subscription
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
        <div className="p-6 bg-green-50 dark:bg-green-900 border-t border-green-100 dark:border-green-800">
          <h3 className="text-lg font-bold mb-3 text-green-800 dark:text-green-200">
            Special Recommendation for Masajid
          </h3>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
              The Masjid App: Better Than WordPress + Elementor
            </h4>

            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Replacing Elementor with The Masjid App gives your Islamic center
              purpose-built tools:
            </p>

            <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                Migration assistance to move your content from
                WordPress/Elementor
              </li>
              <li>
                No more plugin compatibility issues or WordPress security
                concerns
              </li>
              <li>Faster page load times without Elementor's heavy code</li>
              <li>
                Pre-built components specifically designed for Islamic centers
              </li>
              <li>No technical expertise needed to maintain your website</li>
            </ul>

            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg mb-4">
              <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Built specifically for masajid:
              </h5>
              <ul className="grid grid-cols-2 gap-2">
                {[
                  "Prayer Times Widget",
                  "Events Calendar",
                  "Dynamic Slideshows",
                  "Donation Processing",
                  "News & Announcements",
                  "Khutbah Archives",
                  "Ramadan Schedule",
                  "Community Directory",
                ].map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <svg
                      className="h-5 w-5 text-green-600 dark:text-green-400 mr-1"
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

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Unlike WordPress with Elementor that requires constant updates and
              maintenance, The Masjid App handles all technical aspects for you.
              Your staff can focus on content, not technical issues, while
              automatically keeping your website current.
            </p>

            <Link
              href="https://themasjidapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-5 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Learn How The Masjid App Can Help Your Masjid
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementorArticle;
