import { motion } from 'motion/react';
import React, { useState } from 'react';
import EthicalAlternativesButton from './EthicalAlternativesButton';
import LearnTmaButton from './LearnTmaButton';

type TCompanyArticleLayoutProps = {
  companyName: string;
  companySlug: string;
  description: string | React.ReactNode;
  implications: string[];
  isProbablyMasjid?: boolean;
  hostname?: string;
  masjidSection: {
    subtitle: string;
    description: string | React.ReactNode;
    benefits: string[];
    features: string[];
    conclusion: string;
  };
};

const CompanyArticleLayout = function CompanyArticleLayout(
  props: TCompanyArticleLayoutProps
) {
  const {
    companyName,
    companySlug,
    description,
    implications,
    isProbablyMasjid,
    hostname,
    masjidSection
  } = props;
  const [isBoonExpanded, setIsBoonExpanded] = useState(true);
  const toggleBoonExpanded = () => {
    setIsBoonExpanded(!isBoonExpanded);
  };

  return (
    <div className="bg-white dark:bg-gray-800 text-sm sm:text-base">
      {/* Main content - Header is already handled by CompanyList */}
      <div className="p-3 sm:p-6 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          You are using {companyName}
        </h3>

        <p className="text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
          {description}
        </p>

        <div className="mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
            What this means for you:
          </h4>
          <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            {implications.map((implication, index) => (
              <li key={index}>{implication}</li>
            ))}
          </ul>
        </div>

        <EthicalAlternativesButton
          companySlug={companySlug}
          companyName={companyName}
          hostname={hostname}
          isMasjid={isProbablyMasjid}
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
              {masjidSection.subtitle}
            </h4>

            <p className="text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              {masjidSection.description}
            </p>

            <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-gray-700 dark:text-gray-300">
              {masjidSection.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>

            <div className="bg-green-200 dark:bg-green-900 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
              <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Built specifically for masjid&apos;s:
              </h5>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                {masjidSection.features.map((feature) => (
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
              {masjidSection.conclusion}
            </p>

            <LearnTmaButton hostname={hostname} />
          </div>
        </div>
      )}

      {
        <div className="p-3 sm:p-6 bg-purple-200 dark:bg-purple-900/40 border-t border-purple-100 dark:border-purple-800">
          <h3 className="text-lgF font-bold mb-2 sm:mb-3 text-purple-800 dark:text-purple-200">
            Boon Digital Solutions: Professional WordPress Migration & Hosting
          </h3>

          <button
            className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 text-sm sm:text-base shadow-sm mb-2"
            onClick={(e) => {
              e.stopPropagation();
              toggleBoonExpanded();
            }}
          >
            <span className="sm:inline">
              {isBoonExpanded ? 'Show less' : 'Read more'}
            </span>
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              initial={false}
              animate={{ rotate: isBoonExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </motion.svg>
          </button>

          {isBoonExpanded && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm">
              <h4 className="font-semibold text-purple-7-- dark:text-purple-200 mb-2">
                Boon Digital Solutions provides professional website migration
                to get your content onto WordPress platform quickly and
                efficiently. Our migration process ensures reliable results,
                with custom integration options available for organizations
                needing fully integrated web presence solutions.
              </h4>

              <div className="bg-purple-200 dark:bg-purple-700/10 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                  Basic Migration Package Starting at $500
                </h5>
                {/* <p className="text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Basic Migration Package Starting at $500
              </p> */}
                For organizations needing fully integrated web presence:
                <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-gray-700 dark:text-gray-300">
                  <li>
                    WordPress setup - clean, professional foundation tailored to
                    your brand
                  </li>
                  <li>
                    Content page migration - transfer of up to 5 pages included
                  </li>
                  <li>
                    Domain name transfer guidance - for names currently
                    registered through Wix
                  </li>
                  <li>
                    Hosting setup with 2-months free - get set up with
                    WordPress.com and experience live backups, enhanced
                    security, and site analytics
                  </li>
                  <li>
                    Flexibility - have true ownership of your site. You're never
                    locked in with us
                  </li>
                  <li>
                    Quality assurance testing - ensure all content displays
                    correctly after migration
                  </li>
                </ul>
              </div>

              <div className="bg-purple-200 dark:bg-purple-700/10 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                  Custom Integration Available
                </h5>
                For organizations needing fully integrated web presence:
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                  <li className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mr-1 flex-shrink-0"
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
                    Advanced Functionality - specialized features beyond basic
                    content pages
                  </li>
                  <li className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mr-1 flex-shrink-0"
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
                    Complete Digital Strategy - comprehensive web presence
                    planning
                  </li>
                  <li className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mr-1 flex-shrink-0"
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
                    Custom Development - unique features built specifically for
                    your needs
                  </li>
                </ul>
              </div>

              <div className="bg-purple-200 dark:bg-purple-700/10 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                  Ongoing Support & Maintenance Built specifically for growing
                  organizations:
                </h5>
                For organizations needing fully integrated web presence:
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                  <li className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mr-1 flex-shrink-0"
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
                    WordPress Training Included - Learn to manage your site
                    confidently
                  </li>
                  <li className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mr-1 flex-shrink-0"
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
                    Monthly Maintenance Packages - Starting at $100/month for
                    hosted sites
                  </li>
                  <li className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mr-1 flex-shrink-0"
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
                    Regular Security Updates - Keep your site protected and
                    up-to-date
                  </li>
                  <li className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mr-1 flex-shrink-0"
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
                    Performance Monitoring - Ensure optimal site speed and
                    functionality
                  </li>
                  <li className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mr-1 flex-shrink-0"
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
                    Content Support - Assistance with updates and new content
                    creation
                  </li>
                  <li className="flex items-center text-sm">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mr-1 flex-shrink-0"
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
                    Technical Support - Direct access to our team for any issues
                  </li>
                </ul>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                {/* {masjidSection.conclusion} */}
                Unlike Israeli tech that enables genocide and endangers your
                data, Boon digital solutions can be trusted to have your back.
              </p>
              <button className="inline-flex items-center justify-center w-full px-5 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
                {' '}
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href="https://boondigitalsolutions.com/services/website-migration/"
                >
                  Learn How Boon Digital Solutions Can Help You
                </a>
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
              </button>
            </div>
          )}
        </div>
      }
    </div>
  );
};

export default CompanyArticleLayout;
