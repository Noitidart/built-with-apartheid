import React from 'react';
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
    </div>
  );
};

export default CompanyArticleLayout;
