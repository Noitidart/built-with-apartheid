import Link from 'next/link';
import { usePlausible } from 'next-plausible';
import React from 'react';

interface EthicalAlternativesButtonProps {
  companySlug: string;
  companyName: string;
  className?: string;
  hostname?: string;
  isMasjid?: boolean;
}

const EthicalAlternativesButton: React.FC<EthicalAlternativesButtonProps> = ({
  companySlug,
  companyName,
  className = '',
  hostname,
  isMasjid
}) => {
  const plausible = usePlausible();
  
  const trackEthicalAlternativesClick = function trackEthicalAlternativesClick() {
    plausible('ethical_alternatives_clicked', {
      props: {
        company_slug: companySlug,
        company_name: companyName,
        hostname: hostname || 'unknown',
        is_masjid: isMasjid || false
      }
    });
  };
  
  return (
    <div className="flex flex-col items-start w-full">
      <Link
        href={`https://www.israelitechalternatives.com/company/${companySlug}/`}
        target="_blank"
        onClick={trackEthicalAlternativesClick}
        // Let israelitechalternatives.com see the referrer
        // rel="noopener noreferrer"
        className={`inline-flex items-center justify-center sm:justify-start px-3 sm:px-5 py-2 sm:py-3 bg-blue-600 text-white font-medium text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors ${className}`}
      >
        <span className="inline-flex items-center justify-center bg-white rounded mr-2 p-1 flex-shrink-0">
          <img
            src="/t4p.png"
            alt="Boycottech logo"
            className="w-3 h-3 sm:w-4 sm:h-4"
            width={20}
            height={20}
          />
        </span>
        <span className="leading-tight flex-1 sm:flex-none">
          View Ethical Alternatives to {companyName}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 translate-x-0.5 sm:translate-x-1 -translate-y-px -sm:translate-y-1 relative sm:h-4 sm:w-4 inline"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </span>
      </Link>
      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-2 sm:ml-2">
        on israelitechalternatives.com (Boycottech)
      </span>
    </div>
  );
};

export default EthicalAlternativesButton;
