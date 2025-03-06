import Link from "next/link";
import React from "react";

interface EthicalAlternativesButtonProps {
  companySlug: string;
  companyName: string;
  className?: string;
}

const EthicalAlternativesButton: React.FC<EthicalAlternativesButtonProps> = ({
  companySlug,
  companyName,
  className = "",
}) => {
  return (
    <div className="flex flex-col items-start">
      <Link
        href={`https://www.israelitechalternatives.com/company/${companySlug}/`}
        target="_blank"
        // Let israelitechalternatives.com see the referrer
        // rel="noopener noreferrer"
        className={`inline-flex items-center justify-center px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors ${className}`}
      >
        <img
          src="https://www.israelitechalternatives.com/tfp.jpeg"
          alt="Boycottech logo"
          className="w-5 h-5 mr-2 rounded-full"
          width={20}
          height={20}
        />
        View Ethical Alternatives to {companyName}
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
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </Link>
      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-2">
        on israelitechalternatives.com (Boycottech)
      </span>
    </div>
  );
};

export default EthicalAlternativesButton;
