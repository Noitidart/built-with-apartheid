import CompanyList from '@/components/CompanyList';
import Timeline from '@/components/Timeline';
import type { CompanyId } from '@/constants/companies';
import type { TScanRequestBody, TScanResponseData } from '@/pages/api/v1/scan';
import { getCurrentUserId } from '@/utils/user-utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import classnames from 'classnames';
import delay from 'delay';
import { AnimatePresence, motion } from 'motion/react';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

function UrlPage() {
  const router = useRouter();
  const urlInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const url =
    typeof router.query.url === 'string'
      ? router.query.url?.toLocaleLowerCase()
      : Array.isArray(router.query.url)
      ? router.query.url.join('/').toLowerCase()
      : undefined;

  const shouldScanBypassCache = useRef(false);
  const scanQuery = useQuery({
    queryKey: ['scan', url],
    queryFn: async function fetchUrlScan() {
      if (!url) {
        throw new Error('No URL provided');
      }

      const userId = getCurrentUserId();

      const force = shouldScanBypassCache.current;
      shouldScanBypassCache.current = false;

      const [response] = await Promise.all([
        axios.post<TScanResponseData>('/api/v1/scan', {
          url,
          userId,
          force
        } satisfies TScanRequestBody),
        // Make "Analyzing website technologies..." message last at least 2
        // seconds so user can read it to see what just happened.
        delay(2000)
      ]);

      // Invalidate timeline query. As useTimelineQuery will refetch on mount if
      // stale. And while this was loading the <Timeline> was not rendered, so it
      // will render after this, fetching the timeline.
      const websiteId = response.data.website.id;
      queryClient.invalidateQueries({
        queryKey: ['timeline', websiteId]
      });

      return response.data;
    },
    enabled: !!url,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 5000,
    staleTime: 0,
    notifyOnChangeProps: ['data', 'status', 'error', 'isFetching']
  });

  const forceScan = async function forceScan() {
    shouldScanBypassCache.current = true;
    scanQuery.refetch();
  };

  const shouldShowIntro = !router.isReady || !url;

  useEffect(
    function syncUrlInputWithUrl() {
      if (!urlInputRef.current) {
        return;
      }

      if (urlInputRef.current.value === url) {
        return;
      }

      urlInputRef.current.value = url || '';
    },
    [url]
  );

  const goToUrlPageOnSubmit = function goToUrlPageOnSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const urlValue = formData.get('url');
    if (typeof urlValue !== 'string') {
      // TODO: show validation errors
      return;
    }

    const urlValueWithoutProtocol = urlValue
      .replace(/^https?:\/\//, '')
      .toLowerCase();

    if (url && urlValueWithoutProtocol === url) {
      scanQuery.refetch();
      return;
    }

    router.push('/' + encodeURIComponent(urlValueWithoutProtocol), undefined, {
      // Update URL without refreshing page
      shallow: true
    });

    // Animated scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={classnames(
        geistSans.variable,
        geistMono.variable,
        'grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
      )}
    >
      <header className="w-full max-w-4xl">
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" shallow>
            Built With Apartheid
          </Link>
        </motion.h1>
        <motion.p
          className="text-xl text-center text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Identify if your website is keeping your organization and partners
          protected.
        </motion.p>
      </header>

      <main className="flex flex-col gap-10 w-full max-w-4xl">
        <AnimatePresence>
          {shouldShowIntro && (
            <motion.div
              className="flex flex-col gap-10 w-full"
              initial={{ opacity: 1, height: 'auto' }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="relative py-8 px-6 md:p-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute text-[15rem] leading-none text-gray-200 dark:text-gray-700 -top-3 right-1 opacity-50">
                  &quot;
                </div>
                <blockquote className="relative z-10">
                  <p className="text-2xl italic mb-4 text-center">
                    If God is with you, no one can do you harm even if all the
                    bad in the world unites against you.
                  </p>
                  <footer className="text-right text-gray-500 dark:text-gray-400 font-semibold">
                    — Sacred Wisdom
                  </footer>
                </blockquote>
              </motion.div>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Trusting to have Israel with your organization is unlike the
                  above wisdom. Consider how Israel has historically treated its
                  closest ally, the United States - extracting resources,
                  intelligence, and financial support while offering
                  questionable returns.
                </p>

                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Organizations with Israeli subprocessors open themselves up to
                  significant liability due to well-known connections between
                  Israeli companies and the military. As demonstrated by their
                  subversion of the civilian supply chain in Israel&apos;s pager
                  attack and the WhatsApp data alleged to be used in{' '}
                  <Link
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline-svg underline-svg-offset-3"
                    href="https://blog.paulbiggar.com/meta-and-lavender/"
                    target="_blank"
                  >
                    Lavender AI
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 ml-1 inline"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                  .
                </p>

                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Ensure your website is keeping you and your partners secure
                  and trusted.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full">
          <form onSubmit={goToUrlPageOnSubmit} className="mt-4: sm:mt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                ref={urlInputRef}
                type="text"
                name="url"
                placeholder="Enter website URL (e.g., example.com)"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                disabled={scanQuery.isFetching}
                required
              />

              <button
                type="submit"
                disabled={scanQuery.isFetching}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {scanQuery.isFetching ? (
                  <span className="inline-flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Scanning...
                  </span>
                ) : (
                  'Scan Website'
                )}
              </button>
            </div>
          </form>
        </div>

        <AnimatePresence>
          {scanQuery.isFetching && (
            <motion.div
              className="w-full flex flex-col items-center justify-center p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />

              <p className="text-lg font-medium">
                Analyzing website technologies...
              </p>
            </motion.div>
          )}

          {scanQuery.error && (
            <motion.div
              className="w-full p-6 rounded-lg border bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-medium mb-4 text-red-600 dark:text-red-400">
                Error Scanning Website
              </h3>

              <p className="text-lg">{formatScanQueryError(scanQuery.error)}</p>
            </motion.div>
          )}

          {scanQuery.data &&
            // On refetch there is data, but it won't show spinner
            !scanQuery.isFetching && (
              <motion.div
                className={classnames(
                  'w-full p-6 rounded-lg border',
                  getDetectedCompanies(
                    scanQuery.data.scanInteraction.scan.changes
                  ).length > 0
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ScanResults data={scanQuery.data} onForceScan={forceScan} />
              </motion.div>
            )}

          {/* Timeline Component - Show after scan results */}
          {scanQuery.data && !scanQuery.isFetching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Timeline website={scanQuery.data.website} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-16 py-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 w-full">
        <p>
          Made with <span className="dark:hidden">❤️</span>
          <span className="hidden dark:inline">🤍</span> by{' '}
          <Link
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-svg"
            href="https://techforpalestine.org/"
            target="_blank"
          >
            Tech for Palestine
          </Link>
        </p>
      </footer>
    </div>
  );
}

function formatScanQueryError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const errorMessage =
      error.response?.data?.error || 'An unhandled scan request error occurred';
    return errorMessage;
  } else {
    return 'An unhandled error occurred';
  }
}

// Helper function to extract detected companies from companyStatusChanges
function getDetectedCompanies(companyStatusChanges: unknown): CompanyId[] {
  if (!companyStatusChanges || typeof companyStatusChanges !== 'object')
    return [];

  const statusChanges = companyStatusChanges as Record<string, string>;
  return Object.entries(statusChanges)
    .filter(([, status]) => status === 'new' || status === 'still-present')
    .map(([companyId]) => companyId as CompanyId);
}

function formatScanAge(createdAt: Date): string {
  const scanDate = new Date(createdAt);
  const now = new Date();
  const diffInMs = now.getTime() - scanDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const string = rtf.format(-diffInDays, 'day');

  if (diffInDays <= 1) {
    return string;
  } else {
    return string + ' ago';
  }
}

type ScanResultsProps = {
  data: TScanResponseData;
  onForceScan: () => void;
};

function ScanResults({ data, onForceScan }: ScanResultsProps) {
  return (
    <>
      <h3 className="text-xl font-medium mb-4">
        Scan Results for {data.website.hostname}
      </h3>

      {data.isCached && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                Showing cached results from{' '}
                {formatScanAge(data.scanInteraction.createdAt)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                Last scanned:{' '}
                {data.scanInteraction.createdAt
                  ? new Date(
                      data.scanInteraction.createdAt
                    ).toLocaleDateString()
                  : 'Unknown'}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                We don&apos;t re-scan by default unless it&apos;s been over 7
                days, as most likely nothing changed.
              </p>
            </div>
            <button
              onClick={onForceScan}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors whitespace-nowrap"
            >
              Fresh Scan
            </button>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            If you think something changed on this website, click &quot;Fresh
            Scan&quot; to get current results.
          </p>
        </div>
      )}

      <div className="flex items-center mb-4">
        {getDetectedCompanies(data.scanInteraction.scan.changes).length > 0 ? (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-xl font-bold">
              Israeli Technology Detected
            </span>
          </div>
        ) : (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>

            <span className="text-xl font-bold">
              No Israeli Technologies Found
            </span>
          </div>
        )}
      </div>
      <p className="text-lg mb-6">
        {getDetectedCompanies(data.scanInteraction.scan.changes).length > 0
          ? `This website appears to use Israeli technologies. The data privacy and security of your organization and partners have been compromised.`
          : `Your website does not appear to use any Israeli technologies. Continue maintaining high security standards.`}
      </p>

      {getDetectedCompanies(data.scanInteraction.scan.changes).length > 0 && (
        <>
          <h4 className="text-lg font-medium mb-3">Detected Technologies:</h4>

          <CompanyList
            companyIds={getDetectedCompanies(data.scanInteraction.scan.changes)}
            isProbablyMasjid={data.website.isMasjid}
          />
        </>
      )}
    </>
  );
}

export default UrlPage;
