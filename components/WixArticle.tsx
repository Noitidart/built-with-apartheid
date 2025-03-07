import EthicalAlternativesButton from "@/components/EthicalAlternativesButton";
import Link from "next/link";
import React from "react";

interface WixArticleProps {
  isProbablyMasjid?: boolean;
}

const WixArticle: React.FC<WixArticleProps> = ({ isProbablyMasjid }) => {
  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Main content - Header is already handled by CompanyList */}
      <div className="p-6 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          You are using Wix
        </h3>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Wix is an Israeli-owned website builder and hosting platform. Your
          entire website runs on their infrastructure - including your content,
          hosting, domain connection, and design tools.
        </p>

        <div className="mb-6 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
            What this means for you:
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Wix controls your entire website infrastructure</li>
            <li>Limited SEO capabilities compared to other platforms</li>
            <li>
              Vendor lock-in makes it difficult to migrate your content later
            </li>
            <li>Performance limitations that can affect page load speeds</li>
            <li>Monthly subscription fees go to an Israeli company</li>
          </ul>
        </div>

        <EthicalAlternativesButton companySlug="wix" companyName="Wix" />
      </div>

      {/* Masjid-specific section */}
      {isProbablyMasjid && (
        <div className="p-6 bg-green-200 dark:bg-green-900 border-t border-green-100 dark:border-green-800">
          <h3 className="text-lg font-bold mb-3 text-green-800 dark:text-green-200">
            Special Recommendation for Masajid
          </h3>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
              The Masjid App: Complete Solution for Islamic Centers
            </h4>

            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Moving from Wix to The Masjid App provides your Islamic center
              with a platform specifically designed for masajid:
            </p>

            <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li>
                Complete migration assistance from Wix to an ethical platform
              </li>
              <li>Prayer times that automatically adjust for your location</li>
              <li>
                Built-in donation system designed for Islamic organizations
              </li>
              <li>
                Events calendar with recurring events for classes and halaqas
              </li>
              <li>Content management system that staff can easily update</li>
            </ul>

            <div className="bg-green-200 dark:bg-green-900 p-4 rounded-lg mb-4">
              <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Features specifically for masajid:
              </h5>
              <ul className="grid grid-cols-2 gap-2">
                {[
                  "Prayer Times Widget",
                  "Events Calendar",
                  "Dynamic Slideshows",
                  "Zakat Calculator",
                  "Donation Processing",
                  "News & Announcements",
                  "Khutbah Archives",
                  "Ramadan Schedule Generator",
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
              Unlike Wix, The Masjid App keeps your website in sync
              automatically without requiring technical volunteers. Your staff
              can update content through a simple interface, and changes reflect
              across all platforms instantly.
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

export default WixArticle;
