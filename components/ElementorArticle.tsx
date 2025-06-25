import Image from 'next/image';
import React, { useState } from 'react';
import CompanyArticleLayout from './CompanyArticleLayout';

interface ElementorArticleProps {
  isProbablyMasjid?: boolean;
  hostname?: string;
}

const ElementorArticle: React.FC<ElementorArticleProps> = ({
  isProbablyMasjid,
  hostname
}) => {
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [showTwitterWarning, setShowTwitterWarning] = useState(false);

  const description = (
    <div>
      <p className="mb-4">
        Elementor is an Israeli-owned WordPress page builder plugin. You&apos;re
        using it as your website&apos;s design system to create and edit pages
        with its drag-and-drop visual editor.
      </p>
      <p className="mb-4">
        Elementor has been recognized by Israeli authorities for their efforts
        in spreading propaganda. Here&apos;s evidence of their involvement:
      </p>
      <div className="mb-4">
        <button
          onClick={() => setShowTweetModal(true)}
          className="inline-block border border-gray-300 rounded-lg p-2 hover:bg-gray-50 transition-colors"
        >
          <Image
            src="/elementor-tweet.png"
            alt="Tweet showing Elementor's recognition for propaganda efforts"
            width={400}
            height={200}
            className="rounded"
          />
          <p className="text-sm text-gray-600 mt-2">Click to view full tweet</p>
        </button>
      </div>
      <p>
        This demonstrates how Elementor is actively involved in mass propaganda
        operations, using their platform to influence public opinion and collect
        user data for intelligence purposes.
      </p>

      {/* Tweet Modal */}
      {showTweetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Elementor&apos;s Propaganda Recognition
                </h3>
                <button
                  onClick={() => setShowTweetModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              <Image
                src="/elementor-tweet.png"
                alt="Tweet showing Elementor's recognition for propaganda efforts"
                width={600}
                height={400}
                className="w-full rounded"
              />
              <p className="mt-4 text-sm text-gray-600">
                <button
                  onClick={() => setShowTwitterWarning(true)}
                  className="text-blue-600 hover:underline"
                >
                  View original tweet →
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Twitter Warning Modal */}
      {showTwitterWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800">
                  Warning: Leaving Site
                </h3>
              </div>

              <div className="mb-4 text-gray-700">
                <p className="mb-3">
                  <strong>You&apos;re about to visit Twitter/X, which:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Extensively tracks and monetizes your personal data</li>
                  <li>
                    Is owned by Elon Musk who has shown extreme support for
                    Israeli operations
                  </li>
                  <li>
                    Actively censors pro-Palestinian content while amplifying
                    Israeli propaganda
                  </li>
                  <li>
                    Collects device fingerprints, location data, and browsing
                    behavior
                  </li>
                  <li>
                    Shares user data with government agencies and intelligence
                    services
                  </li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTwitterWarning(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Stay Here
                </button>
                <a
                  href="https://twitter.com/elementor/status/1713586652768084368"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-center"
                  onClick={() => setShowTwitterWarning(false)}
                >
                  Continue Anyway
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <CompanyArticleLayout
      companyName="Elementor"
      companySlug="elementor"
      description={description}
      implications={[
        'Israeli company: Elementor Ltd. is headquartered in Tel Aviv and actively collaborates with Israeli intelligence agencies',
        'Data harvesting operation: Collects extensive user data including IP addresses, device information, geolocation, and website analytics for intelligence purposes',
        'Security vulnerabilities: Known as the "buggiest plugin in WordPress" with frequent security holes and database corruption issues',
        'Database embedding: Impossible to cleanly uninstall - embeds deeply into WordPress database requiring full site reset to remove',
        'Performance killer: Bloated code and excessive JavaScript cause slow loading speeds and poor Core Web Vitals scores',
        'Outdated technology: Built before modern WordPress Gutenberg editor, now redundant and unnecessarily complex',
        'Hidden surveillance: Uses local storage and session storage to track user behavior across sessions for data collection'
      ]}
      isProbablyMasjid={isProbablyMasjid}
      hostname={hostname}
      masjidSection={{
        subtitle:
          'The Masjid App: Beyond Elementor - A Complete Islamic Tech Stack',
        description: (
          <div>
            <p className="mb-3">
              TMA doesn&apos;t just replace Elementor - we go far beyond,
              providing a complete technology ecosystem designed specifically
              for Islamic organizations across the entire tech stack.
            </p>
            <p>
              While Elementor forces you to piece together dozens of plugins and
              services, TMA provides everything integrated seamlessly from day
              one.
            </p>
          </div>
        ),
        benefits: [
          "Complete privacy protection - zero data collection vs Elementor's surveillance operation",
          'Enterprise-grade security built-in - no plugins needed, no vulnerabilities to exploit',
          'Modern WordPress with Gutenberg - faster and more reliable than outdated Elementor',
          'Clean architecture - never embeds into your database like Elementor does',
          'Automatic updates across entire stack - no technical maintenance required',
          'Purpose-built Islamic features - hijri calendar, prayer times, and more'
        ],
        features: [
          'Hijri Calendar Integration',
          'Prayer Times Automation',
          'Event Management System',
          'Donation Processing',
          'Community Directory',
          'Khutbah Archives',
          'Islamic Content Library',
          'Multi-language Support'
        ],
        conclusion:
          'Unlike Elementor that creates security risks and requires constant maintenance, The Masjid App provides a complete, secure, and automated solution. Your team can focus on serving the community while we handle all technical aspects - from hosting to security to Islamic-specific functionality.'
      }}
    />
  );
};

export default ElementorArticle;
