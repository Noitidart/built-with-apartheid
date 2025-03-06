import { COMPANIES } from "@/constants/companies";
import Link from "next/link";
import React from "react";

interface CompanyArticleProps {
  companyId: string;
  isProbablyMasjid?: boolean;
}

export const CompanyArticle: React.FC<CompanyArticleProps> = ({
  companyId,
  isProbablyMasjid = false,
}) => {
  const company = COMPANIES.find((c) => c.id === companyId);

  if (!company) return null;

  const { name, Logo, description, alternativesUrl } = company;

  return (
    <article className="mb-8 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-red-50 dark:bg-red-900 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-lg p-2 flex items-center justify-center">
            <Logo />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-200">
              {name}
            </h2>
            <p className="text-red-600 dark:text-red-300 font-medium">
              Detected on your website
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          You are using {name}
        </h3>

        <p className="text-gray-700 dark:text-gray-300 mb-6">{description}</p>

        <Link
          href={alternativesUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Ethical Alternatives to {name}
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
      </div>

      {/* Masjid-specific section */}
      {isProbablyMasjid && (
        <div className="p-6 bg-green-50 dark:bg-green-900 border-t border-green-100 dark:border-green-800">
          <h3 className="text-lg font-bold mb-3 text-green-800 dark:text-green-200">
            Special Recommendation for Masajid
          </h3>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
              The Masjid App: Complete Solution for Islamic Centers
            </h4>

            <p className="text-gray-700 dark:text-gray-300 mb-3">
              The Masjid App isn't just an alternative—it's a comprehensive
              solution specifically designed for masajid that will:
            </p>

            <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li>Replace your current platform with ethical technology</li>
              <li>Save your staff time with automated content management</li>
              <li>
                Keep your entire digital infrastructure free from problematic
                technologies
              </li>
              <li>Increase donations through optimized giving pathways</li>
              <li>
                Provide community engagement tools built specifically for
                Islamic centers
              </li>
            </ul>

            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg mb-4">
              <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Built-in Features for Masajid:
              </h5>
              <ul className="grid grid-cols-2 gap-2">
                {[
                  "Prayer Times Widget",
                  "Events Calendar",
                  "Dynamic Slideshows",
                  "Donation Processing",
                  "News & Announcements",
                  "Khutbah Archives",
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
              The Masjid App keeps your website in sync automatically without
              requiring technical volunteers. Your staff can update content
              through a simple interface, and changes reflect across all
              platforms instantly.
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
    </article>
  );
};
