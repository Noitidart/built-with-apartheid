import ActivityTables from '@/components/ActivityTables';
import Button from '@/components/Button';
import CompanyList from '@/components/CompanyList';
import ScanInfoMessage from '@/components/ScanInfoMessage';
import Spinner from '@/components/Spinner';
import Timeline from '@/components/Timeline';
import WatchButton from '@/components/WatchButton';
import WatchedSitesSidebar from '@/components/WatchedSitesSidebar';
import type { CompanyId } from '@/constants/companies';
import useForceRender from '@/hooks/useForceRender';
import {
  hasAnyFormError,
  hasFormError
} from '@/lib/response/response-error-utils';
import { isNonNullish } from '@/lib/typescript';
import { useRetriggerDeepLinkScroll } from '@/lib/useRetriggerDeepLinkScroll';
import type { TScanRequestBody, TScanResponseData } from '@/pages/api/v1/scan';
import {
  useQuery,
  useQueryClient,
  type QueryObserverResult
} from '@tanstack/react-query';
import axios from 'axios';
import classnames from 'classnames';
import delay from 'delay';
import { get } from 'lodash';
import { AnimatePresence, motion } from 'motion/react';
import { usePlausible } from 'next-plausible';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

function UrlPage() {
  const { waitingToScrollModal } = useRetriggerDeepLinkScroll(
    'Waiting for post load...'
  );
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
  const scanSourceRef = useRef<
    'search_form' | 'url_navigation' | 'fresh_scan_button'
  >('url_navigation');
  const scanStartTimeRef = useRef<number>(0);
  const trackScanInitiated = useTrackScanInitiated({
    source: scanSourceRef.current,
    hostname: url || ''
  });

  const scanQuery = useQuery({
    queryKey: ['scan', url],
    queryFn: async function fetchUrlScan() {
      if (!url) {
        throw new Error('No URL provided');
      }

      // Track scan initiated
      scanStartTimeRef.current = Date.now();
      trackScanInitiated();

      const force = shouldScanBypassCache.current;

      const [response] = await Promise.all([
        axios.post<TScanResponseData>('/api/v1/scan', {
          url,
          force
        } satisfies TScanRequestBody),
        // Make "Analyzing website technologies..." message last at least 2
        // seconds so user can read it to see what just happened.
        delay(2000)
      ]);

      shouldScanBypassCache.current = false;

      if ('website' in response.data === false) {
        // Only has _errors key
        throw response.data;
      }

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
    // We show user-friendly error message to user after every retry, and we
    // have manual way to retry which includes a countdown-based-auto-retry.
    // Rather then the invisible auto-retry where the user has no idea the
    // request is taking long due to retries.
    retry: false,
    notifyOnChangeProps: [
      'data',
      'status',
      'error',
      'isFetching',
      'isSuccess',
      'isError',
      'errorUpdatedAt',
      'errorUpdateCount'
    ]
  });

  const forceScan = function forceScan() {
    shouldScanBypassCache.current = true;
    scanSourceRef.current = 'fresh_scan_button';
    // So it resets the error count. As opposted to scanQuery.refetch
    queryClient.resetQueries({ queryKey: ['scan', url] });
  };

  useTrackView(scanQuery.data?.website?.id);

  const shouldShowIntro = !router.isReady || !url;

  // Track scan completed
  const trackScanCompleted = useTrackScanCompleted({
    startTime: scanStartTimeRef.current,
    hostname: url || '',
    isCached: scanQuery.data?.isCached || false,
    data: scanQuery.data
  });

  useEffect(
    function trackScanSuccess() {
      if (scanQuery.isSuccess && scanQuery.data && !scanQuery.isFetching) {
        trackScanCompleted();
      }
    },
    [
      scanQuery.isSuccess,
      scanQuery.data,
      scanQuery.isFetching,
      trackScanCompleted
    ]
  );

  // Track scan errors
  const trackScanError = useTrackScanError({
    error: scanQuery.error,
    attemptNumber: scanQuery.errorUpdateCount
  });

  useEffect(
    function trackScanFailure() {
      if (scanQuery.isError && !scanQuery.isFetching) {
        trackScanError();
      }
    },
    [
      scanQuery.isError,
      scanQuery.isFetching,
      scanQuery.errorUpdateCount,
      trackScanError
    ]
  );

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

    // Use cache if available.
    shouldScanBypassCache.current = false;
    scanSourceRef.current = 'search_form';

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
      // So it resets the error count. As apposed to scanQuery.refetch
      queryClient.resetQueries({ queryKey: ['scan', url] });
      return;
    }

    router.push('/' + encodeURIComponent(urlValueWithoutProtocol), undefined, {
      // Update URL without refreshing page
      shallow: true
    });

    // Animated scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [sendingCleanEmail, setSendingCleanEmail] = useState(false);

  return (
    <>
      <header className="w-full max-w-4xl mx-auto">
        <motion.h1
          className="text-4xl sm:text-6xl font-bold text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" shallow>
            Built With Apartheid
          </Link>
        </motion.h1>

        <motion.p
          className="mb-4 sm:text-xl text-center text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Identify if a website is compromising the owner and its visitors.
        </motion.p>
      </header>

      <main className="flex flex-col gap-10 w-full max-w-4xl mx-auto">
        {waitingToScrollModal}

        {/* Scan Input - Always visible */}
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
                autoCapitalize="off"
                autoCorrect="off"
                required
              />

              <Button
                type="submit"
                loading={scanQuery.isFetching}
                size="md"
                label={scanQuery.isFetching ? 'Scanning...' : 'Scan Website'}
              />
            </div>
          </form>
        </div>

        <AnimatePresence>
          {shouldShowIntro && (
            <motion.div
              className="flex flex-col gap-10 w-full"
              initial={{ opacity: 1, height: 'auto' }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Activity Tables */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <ActivityTables />
              </motion.div>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Trusting to have Israeli tech on your website is trusting
                  Israel to be your partner and ally. This is unsafe for every
                  person in the organization, from owners to stakeholders to
                  simple visitors. Consider how Israel has historically treated
                  its closest ally, the United States - extracting resources,
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

        <AnimatePresence mode="wait">
          {scanQuery.isFetching && (
            <ProgressiveLoading key="loading" hostname={url || ''} />
          )}

          {scanQuery.isError && !scanQuery.isFetching && (
            <ScanQueryErrorDisplay
              key="error"
              error={scanQuery.error}
              refetch={scanQuery.refetch}
              errorUpdatedAt={scanQuery.errorUpdatedAt}
              errorUpdateCount={scanQuery.errorUpdateCount}
            />
          )}

          {/* Watch Button - Show when we have scan results */}
          {scanQuery.isSuccess && scanQuery.data && !scanQuery.isFetching && (
            <motion.div
              key="watch-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <WatchButton
                me={scanQuery.data.me}
                website={scanQuery.data.website}
              />
            </motion.div>
          )}

          {scanQuery.isSuccess &&
            scanQuery.data &&
            // On refetch there is data, but it won't show spinner
            !scanQuery.isFetching && (
              <motion.div
                key="results"
                className={classnames(
                  'w-full p-4 sm:p-6 rounded-lg border',
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
                <ScanInfoMessage
                  hostname={scanQuery.data.website.hostname}
                  detectedCompanies={getDetectedCompanies(
                    scanQuery.data.scanInteraction.scan.changes
                  )}
                  websiteId={scanQuery.data.website.id}
                  scanId={scanQuery.data.scanInteraction.scan.id}
                />
              </motion.div>
            )}

          {/* Timeline Component - Show after scan results */}
          {scanQuery.data && scanQuery.isSuccess && !scanQuery.isFetching && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Timeline website={scanQuery.data.website} />
            </motion.div>
          )}
        </AnimatePresence>

        <WatchedSitesSidebar />
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
    </>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  let result = `${hours}h`;
  if (remainingMinutes > 0) {
    result += ` ${remainingMinutes}m`;
  }
  if (remainingSeconds > 0 && hours === 0) {
    result += ` ${remainingSeconds}s`;
  }

  return result;
}

function getScanErrorMessageAndRetryInfo({
  error,
  errorUpdatedAt,
  errorUpdateCount
}: {
  error: unknown;
  errorUpdatedAt: number;
  errorUpdateCount: number;
}): {
  message: React.ReactNode;
  autoRetryMessage?: string;
  autoRetryAt?: number;
  blockRetryUntil?: number;
  attempts: number;
  retries: number;
  maxRetries?: number;
} {
  const now = Date.now();
  const attempts = errorUpdateCount;
  const retries = Math.max(attempts - 1, 0);

  const returnUnhandledError = (step: string) => {
    console.error('Unhandled error:', {
      step,
      error,
      errorUpdatedAt,
      errorUpdateCount
    });
    return {
      message: 'An unexpected error occurred.',
      attempts,
      retries
    };
  };

  if (!axios.isAxiosError(error)) {
    return returnUnhandledError('axios.isAxiosError');
  }

  const firstFormError = get(error, 'response.data._errors.formErrors[0]');
  let errorKey: string;
  let errorMeta: Record<string, unknown> | null = null;
  if (
    Array.isArray(firstFormError) &&
    typeof firstFormError[0] === 'string' &&
    firstFormError[1] &&
    typeof firstFormError[1] === 'object'
  ) {
    console.log('firstFormError:', firstFormError);
    errorKey = firstFormError[0];
    errorMeta = firstFormError[1];
    console.log('errorMeta:', errorMeta);
  } else if (typeof firstFormError === 'string') {
    errorKey = firstFormError;
  } else {
    return returnUnhandledError('firstFormError');
  }

  const blockRetryUntilDate =
    typeof errorMeta?.blockRetryUntilDate === 'string'
      ? errorMeta.blockRetryUntilDate
      : undefined;

  let errorConfig: {
    blockRetryUntilDate?: string;
    autoRetrySecondsOrDate?: number | string;
    maxRetries?: number;
  };

  switch (errorKey) {
    case 'requestErrors.rateLimitExceeded':
      console.log('requestErrors.rateLimitExceeded:', blockRetryUntilDate);
      errorConfig = {
        blockRetryUntilDate,
        autoRetrySecondsOrDate: blockRetryUntilDate
      };
      break;
    case 'cfBrowserRendering.browserInterrupted':
    case 'cfBrowserRendering.creationTimeout':
    case 'requestErrors.networkError':
    case 'requestErrors.serviceUnavailable':
      errorConfig = {
        autoRetrySecondsOrDate: 5,
        maxRetries: 2
      };
      break;
    case 'websiteErrors.serviceUnavailable':
      errorConfig = {};
      break;
    default:
      console.error('Unhandled error key from scan error:', {
        errorKey
      });
      return returnUnhandledError('errorKey to errorConfig');
  }

  let autoRetryAt: number | undefined;
  if (
    errorConfig.maxRetries === undefined ||
    retries < errorConfig.maxRetries
  ) {
    if (typeof errorConfig.autoRetrySecondsOrDate === 'number') {
      // its seconds
      autoRetryAt = errorUpdatedAt + errorConfig.autoRetrySecondsOrDate * 1000;
    } else if (typeof errorConfig.autoRetrySecondsOrDate === 'string') {
      // its a date
      autoRetryAt = new Date(errorConfig.autoRetrySecondsOrDate).getTime();
    } // else there is no auto-retry for this error
  }

  let blockRetryUntil: number | undefined;
  if (errorConfig.blockRetryUntilDate) {
    blockRetryUntil = new Date(errorConfig.blockRetryUntilDate).getTime();
  }

  let firstSentenceOfMessage: string;
  switch (errorKey) {
    case 'requestErrors.rateLimitExceeded':
      firstSentenceOfMessage = 'Too many people running scans right now.';
      break;
    case 'cfBrowserRendering.browserInterrupted':
    case 'cfBrowserRendering.creationTimeout':
    case 'requestErrors.networkError':
    case 'requestErrors.serviceUnavailable':
      firstSentenceOfMessage =
        'The scanning service we use is having temporary troubles.';
      break;
    case 'websiteErrors.serviceUnavailable':
      firstSentenceOfMessage = 'The website is currently down.';
      break;
    default:
      return returnUnhandledError('errorKey to firstSentenceOfMessage');
  }

  let secondSentenceOfMessage: React.ReactNode;
  if (blockRetryUntil) {
    if (now < blockRetryUntil) {
      secondSentenceOfMessage = (
        <>
          Please try again in{' '}
          <strong className="font-semibold">
            {formatDuration(Math.ceil((blockRetryUntil - now) / 1000))}
          </strong>
          .
        </>
      );
    } else {
      secondSentenceOfMessage = 'Please try again.';
    }
  } else if (autoRetryAt) {
    if (now < autoRetryAt) {
      secondSentenceOfMessage = 'Please try again in a moment.';
    } else {
      secondSentenceOfMessage = 'Automatically retrying now...';
    }
  } else {
    secondSentenceOfMessage = 'Please try again in a moment.';
  }

  const message = (
    <>
      {firstSentenceOfMessage} {secondSentenceOfMessage}
    </>
  );

  let autoRetryMessage: string | undefined;
  if (autoRetryAt) {
    if (now < autoRetryAt) {
      autoRetryMessage = `Auto-retry in ${formatDuration(
        Math.ceil((autoRetryAt - now) / 1000)
      )}...`;
    } else {
      autoRetryMessage = 'Auto-retrying now...';
    }
  } // no auto-retry for this error

  return {
    message,
    autoRetryMessage,
    autoRetryAt,
    blockRetryUntil,
    attempts,
    retries,
    maxRetries: errorConfig.maxRetries
  };
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

type ProgressiveLoadingProps = {
  hostname: string;
};

function ProgressiveLoading({ hostname }: ProgressiveLoadingProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing scan...');

  useEffect(function updateCounter() {
    const interval = setInterval(function incrementSecond() {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return function cleanup() {
      clearInterval(interval);
    };
  }, []);

  useEffect(
    function updateMessage() {
      const laterMessages = [
        'Peeking under the hood...',
        'Following the digital breadcrumbs...',
        'Scanning for tech fingerprints...',
        "Investigating the website's DNA...",
        'Almost cracked the code...',
        'Just a few more moments...'
      ];

      if (elapsedSeconds < 2) {
        setCurrentMessage('Starting up a dedicated web browser...');
      } else if (elapsedSeconds < 6) {
        setCurrentMessage(`Loading ${hostname}...`);
      } else if (elapsedSeconds < 9) {
        setCurrentMessage('Scanning technologies...');
      } else if (elapsedSeconds < 12) {
        setCurrentMessage('Reading between the lines of code...');
      } else {
        // Random rotation every 5 seconds after 12s
        const rotationIndex = Math.floor((elapsedSeconds - 12) / 5);
        const messageIndex = rotationIndex % laterMessages.length;
        setCurrentMessage(laterMessages[messageIndex]);
      }
    },
    [elapsedSeconds, hostname]
  );

  return (
    <motion.div
      className="w-full flex flex-col items-center justify-center p-4 sm:p-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Spinner size="lg" color="blue" className="mb-4" />

      <p className="text-lg font-medium">
        {currentMessage}

        {/* Absolutely positioned so the change in number doesn't cause a layout shift */}
        {elapsedSeconds > 0 && (
          <span className="absolute">&nbsp;{elapsedSeconds}s</span>
        )}
      </p>
    </motion.div>
  );
}

type TScanQuery = QueryObserverResult<TScanResponseData, Error>;
type TScanQueryErrorDisplayProps = Pick<
  TScanQuery,
  'error' | 'refetch' | 'errorUpdatedAt' | 'errorUpdateCount'
>;

function ScanQueryErrorDisplay(props: TScanQueryErrorDisplayProps) {
  const { refetch } = props;
  const errorInfo = getScanErrorMessageAndRetryInfo(props);
  const forceRender = useForceRender();

  useEffect(
    function setupCountdownRerenderEverySecondOnCountdownConfigChange() {
      const countdownEnds = [
        errorInfo.autoRetryAt,
        errorInfo.blockRetryUntil
      ].filter(isNonNullish);

      if (countdownEnds.length === 0) {
        return;
      }

      let timeoutId: number | undefined;

      const rerenderCountdownsNextWholeSecond =
        function maybeSetupCountdownRerenders() {
          const now = Date.now();
          const hasActiveCountdowns = Math.max(...countdownEnds) > now;

          if (!hasActiveCountdowns) {
            return;
          }

          const milliSecUntilNextWholeSecond = 1000 - (now % 1000);

          timeoutId = window.setTimeout(function rerenderCountdowns() {
            forceRender();
            maybeSetupCountdownRerenders();
          }, milliSecUntilNextWholeSecond);
        };

      rerenderCountdownsNextWholeSecond();

      return function clearCountdownRerenderEverySecondBeforeCountdownConfigChangeOrUnmount() {
        window.clearTimeout(timeoutId);
      };
    },
    [errorInfo.autoRetryAt, errorInfo.blockRetryUntil, forceRender]
  );

  useEffect(
    function maybeSetupRefetchOnAutoRetryAtChange() {
      if (!errorInfo.autoRetryAt) {
        return;
      }

      const millisTillAutoRetry = Math.max(
        errorInfo.autoRetryAt - Date.now(),
        0
      );
      const interval = setInterval(function refetchOnAutoRetryAtChange() {
        // We don't want to reset errorUpdateCount as we use that to determine if we hit max retries.
        refetch();
      }, millisTillAutoRetry);

      return function clearRefetchOnAutoRetryAtChange() {
        clearInterval(interval);
      };
    },
    [errorInfo.autoRetryAt, refetch]
  );

  return (
    <motion.div
      className="w-full p-6 rounded-lg border bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
        Scan Failed
      </h3>

      <p className="text-lg mb-4">{errorInfo.message}</p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Button
          onClick={function refetchOnClick() {
            // We don't want to reset errorUpdateCount as we use that to determine if we hit max retries.
            refetch();
          }}
          type="button"
          size="md"
          label="Try Now"
          // * "disabled:!opacity-35" - As we are on a red background, the
          //   default disabled:opacity-70 doesn't look very disabled.
          className="whitespace-nowrap disabled:!opacity-35"
          disabled={
            !!errorInfo.blockRetryUntil &&
            errorInfo.blockRetryUntil > Date.now()
          }
        />

        {errorInfo.autoRetryMessage && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Spinner size="sm" color="currentColor" />

            <span>{errorInfo.autoRetryMessage}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

type ScanResultsProps = {
  data: Extract<TScanResponseData, { website: object }>;
  onForceScan: () => void;
};

function ScanResults({ data, onForceScan }: ScanResultsProps) {
  const detectedCompanies = getDetectedCompanies(
    data.scanInteraction.scan.changes
  );
  const hasDetectedCompanies = detectedCompanies.length > 0;

  const trackFreshScanBlocked = useTrackFreshScanBlocked();

  useEffect(
    function trackBlockedFreshScan() {
      if (
        data.isCached &&
        hasFormError('scanErrors.freshScanDeniedAsLastScanIsTooRecent', data)
      ) {
        trackFreshScanBlocked();
      }
    },
    // Only run once when component mounts with this data
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <h3 className="text-lg sm:text-xl font-medium mb-4">
        Scan Results for {data.website.hostname}
      </h3>

      {data.isCached && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                Showing recent scan from{' '}
                {formatScanAge(data.scanInteraction.createdAt)}
              </p>

              <p className="text-xs text-blue-600 dark:text-blue-400">
                {hasFormError('websiteErrors.serviceUnavailable', data)
                  ? 'The website is currently down. Please try again soon.'
                  : hasFormError(
                        'scanErrors.freshScanDeniedAsLastScanIsTooRecent',
                        data
                      )
                    ? 'You tried to get a fresh scan, but the latest scan is less than 10 minutes ago so it was denied.'
                    : "We don't re-scan by default unless it's been over 7 days, as most likely nothing changed."}
              </p>
            </div>

            <Button
              onClick={onForceScan}
              size="sm"
              label={hasAnyFormError(data) ? 'Try Again' : 'Fresh Scan'}
              className="whitespace-nowrap"
            />
          </div>
        </div>
      )}

      <div className="flex items-center mb-4">
        <div
          className={classnames(
            'flex flex-col sm:flex-row sm:items-center',
            hasDetectedCompanies
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'
          )}
        >
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
              d={
                hasDetectedCompanies
                  ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  : 'M5 13l4 4L19 7'
              }
            />
          </svg>

          <span className="text-xl font-bold">
            {hasDetectedCompanies
              ? 'Israeli Technology Detected'
              : 'No Israeli Technologies Found'}
          </span>
        </div>
      </div>

      <p className="text-base sm:text-lg mb-6">
        {hasDetectedCompanies
          ? `This website appears to use Israeli technologies. The data privacy and security of your organization and partners have been compromised.`
          : `Your website does not appear to use any Israeli technologies. Continue maintaining high security standards.`}
      </p>

      {hasDetectedCompanies && (
        <>
          <h4 className="text-lg font-medium mb-3">Detected Technologies:</h4>

          <CompanyList
            companyIds={detectedCompanies}
            isProbablyMasjid={data.website.isMasjid}
            hostname={data.website.hostname}
          />
        </>
      )}
    </>
  );
}

// Scan tracking functions
function useTrackScanInitiated(input: {
  source: 'search_form' | 'url_navigation' | 'fresh_scan_button';
  hostname: string;
}) {
  const plausible = usePlausible();

  return function trackScanInitiated() {
    plausible('scan_initiated', {
      props: {
        source: input.source,
        hostname: input.hostname
      }
    });
  };
}

function useTrackScanCompleted(input: {
  startTime: number;
  hostname: string;
  isCached: boolean;
  data: TScanResponseData | undefined;
}) {
  const plausible = usePlausible();

  return function trackScanCompleted() {
    if (!input.data || !('website' in input.data)) return;

    const duration = Math.round((Date.now() - input.startTime) / 1000);
    const infectionCount = getDetectedCompanies(
      input.data.scanInteraction.scan.changes
    ).length;

    plausible('scan_completed', {
      props: {
        duration_seconds: duration,
        result: 'success',
        infection_count: infectionCount,
        is_cached: input.isCached,
        is_masjid: input.data.website.isMasjid
      }
    });
  };
}

function useTrackScanError(input: { error: unknown; attemptNumber: number }) {
  const plausible = usePlausible();

  return function trackScanError() {
    const errorInfo = getScanErrorInfo(input.error);

    plausible('scan_error', {
      props: {
        error_type: errorInfo.errorKey,
        retry_attempt: input.attemptNumber
      }
    });
  };
}

function useTrackFreshScanBlocked() {
  const plausible = usePlausible();

  return function trackFreshScanBlocked() {
    plausible('fresh_scan_blocked', {
      props: {
        reason: 'too_recent'
      }
    });
  };
}

function getScanErrorInfo(error: unknown): { errorKey: string } {
  if (!axios.isAxiosError(error)) {
    return { errorKey: 'unknown_error' };
  }

  const firstFormError = get(error, 'response.data._errors.formErrors[0]');
  let errorKey: string;

  if (Array.isArray(firstFormError) && typeof firstFormError[0] === 'string') {
    errorKey = firstFormError[0];
  } else if (typeof firstFormError === 'string') {
    errorKey = firstFormError;
  } else {
    errorKey = 'unknown_error';
  }

  return { errorKey };
}

function useTrackView(websiteId: number | undefined) {
  useEffect(
    function trackWebsiteView() {
      if (!websiteId) return;

      axios.post(`/api/v1/${websiteId}/view`).catch((error) => {
        console.error('Failed to track view:', error);
      });
    },
    [websiteId]
  );
}

export default UrlPage;
