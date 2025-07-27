import Button from '@/components/Button';
import { COMPANIES } from '@/constants/companies';
import { useTimelineQuery } from '@/hooks/useTimelineQuery';
import { assertNever } from '@/lib/typescript';
import type {
  TPostRequestBody,
  TPostResponseData
} from '@/pages/api/v1/[websiteId]/post';
import type {
  TTimelineCompany,
  TTimelinePostInteractionWithNumber,
  TTimelineReportInteraction,
  TTimelineResponseData,
  TTimelineScanInteractionWithNumber
} from '@/pages/api/v1/[websiteId]/timeline';
import {
  assertIsMilestoneInteraction,
  assertIsScanInteraction
} from '@/types/interaction';
import type { TWebsite } from '@/types/website';
import axios from 'axios';
import classnames from 'classnames';
import { AnimatePresence, motion } from 'motion/react';
import { usePlausible } from 'next-plausible';
import { memo, useEffect, useState } from 'react';

type TimelineProps = {
  website: Pick<TWebsite, 'id' | 'isMasjid'>;
};

function useRateLimitCountdown() {
  const [rateLimitError, setRateLimitError] = useState<
    [string, { retryAfter: string }] | null
  >(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(
    function updateCountdownOnRateLimitChange() {
      if (!rateLimitError) {
        setCountdown(0);
        return;
      }

      const retryAfterDate = new Date(rateLimitError[1].retryAfter);

      function updateCountdown() {
        const now = Date.now();
        const remaining = Math.max(
          0,
          Math.ceil((retryAfterDate.getTime() - now) / 1000)
        );
        setCountdown(remaining);

        if (remaining === 0) {
          setRateLimitError(null);
        }
      }

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    },
    [rateLimitError]
  );

  return { countdown, rateLimitError, setRateLimitError };
}

function Timeline({ website }: TimelineProps) {
  const timelineQuery = useTimelineQuery(website.id);

  if (timelineQuery.isLoading) {
    return (
      <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (timelineQuery.error) {
    return (
      <div className="w-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
          Error Loading Timeline
        </h3>
        <p className="text-red-700 dark:text-red-300">
          Failed to load activity. Please try again later.
        </p>
      </div>
    );
  }

  const data = timelineQuery.data;
  if (!data) {
    return null;
  }

  // Calculate community stats
  const totalScans = data.interactions.filter(function isScanType(interaction) {
    return interaction.type === 'SCAN';
  }).length;
  const totalPosters = data.totalPosters;
  
  // Calculate current infection count
  const activeInfectionCount = data.companies.filter(isActive).length;
  
  // Check if user has posted before
  const userHasPosted = data.interactions.some(
    function isPostByCurrentUser(interaction) {
      return interaction.type === 'POST' && interaction.post?.userNumber === data.meUserNumber;
    }
  );
  const isFirstPost = !userHasPosted;

  return (
    <div className="w-full space-y-6">
      <ActiveCompanyList
        companies={data.companies}
        totalScans={totalScans}
        totalPosters={totalPosters}
      />

      {/* Community Timeline Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-2">Community Timeline</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Share your outreach efforts and coordinate with others to help
            inform the owners of this website to transition away or keep away
            from Israeli technology.
          </p>
        </div>

        {/* Post Form Section */}
        <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <PostForm
            websiteId={website.id}
            meUserNumber={data.meUserNumber}
            refetchTimelineQuery={timelineQuery.refetch}
            isMasjid={website.isMasjid}
            infectionCount={activeInfectionCount}
            isFirstPost={isFirstPost}
          />
        </div>

        {/* Timeline Entries */}
        <div>
          <AnimatePresence>
            {data.interactions.map((interaction, index) => (
              <motion.div
                key={interaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Interaction interaction={interaction} timelineData={data} />
              </motion.div>
            ))}
          </AnimatePresence>

          {data.interactions.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>
                No community activity yet. Be the first to scan this website!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to extract detected companies from companyStatusChanges
function getDetectedCompanies(companyStatusChanges: unknown): string[] {
  if (!companyStatusChanges || typeof companyStatusChanges !== 'object')
    return [];

  const statusChanges = companyStatusChanges as Record<string, string>;
  return Object.entries(statusChanges)
    .filter(([, status]) => status === 'new' || status === 'still-present')
    .map(([companyId]) => companyId);
}

// Utility functions for company status
function isActive(company: TTimelineCompany): boolean {
  // A company is active if it has at least one infection with end: null
  return company.infections.some((infection) => infection.end === null);
}

function getFirstDetectedAt(company: TTimelineCompany): Date | null {
  // Design decision: Even if there are multiple detections, we use the first detection
  // as they obviously didn't learn the lesson to boycott it and are still using it
  const firstInfection = company.infections[0];
  return firstInfection?.start ? new Date(firstInfection.start) : null;
}

type ActiveCompanyListProps = {
  companies: TTimelineCompany[];
  totalScans: number;
  totalPosters: number;
};

const ActiveCompanyList = memo(function ActiveCompanyList({
  companies,
  totalScans,
  totalPosters
}: ActiveCompanyListProps) {
  const activeCompanies = companies.filter(isActive);

  if (activeCompanies.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {activeCompanies.map((company) => {
        const companyInfo = COMPANIES.find((c) => c.id === company.id);
        const firstDetectedAt = getFirstDetectedAt(company);

        const daysSinceFirst = firstDetectedAt
          ? Math.floor(
              (Date.now() - new Date(firstDetectedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        // Check if this company was ever removed (has resolved infections)
        const wasEverRemoved = company.infections.some(
          (infection) => infection.end !== null
        );

        return (
          <div key={company.id} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-0">
                  Still using {companyInfo?.name || company.id}
                  {wasEverRemoved ? ' (added back after removal)' : ''}
                </h4>
                <div className="text-gray-600 dark:text-gray-400 space-y-1 sm:space-y-0">
                  <div className="sm:inline">
                    First detected on{' '}
                    {firstDetectedAt
                      ? new Date(firstDetectedAt).toLocaleDateString()
                      : 'Unknown'}
                  </div>
                  <div className="flex flex-col sm:inline sm:ml-2 space-y-1 sm:space-y-0">
                    <span className="sm:before:content-['•'] sm:before:mx-2">
                      {totalScans} community scans
                    </span>
                    <span className="sm:before:content-['•'] sm:before:mx-2">
                      {totalPosters} people taking action
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg sm:flex-shrink-0">
                <div className="text-2xl font-bold">
                  {daysSinceFirst === 0 ? 'Today' : `Day ${new Intl.NumberFormat().format(daysSinceFirst + 1)}`}
                </div>
                <div className="text-sm">
                  {daysSinceFirst === 0 ? 'detected' : 'using Israeli tech'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
});

type PostFormProps = {
  websiteId: number;
  meUserNumber: number;
  /** Should be awaitable to know when the refetch finishes */
  refetchTimelineQuery: () => Promise<unknown>;
  isMasjid: boolean;
  infectionCount: number;
  isFirstPost: boolean;
};

function PostForm({
  websiteId,
  meUserNumber,
  refetchTimelineQuery,
  isMasjid,
  infectionCount,
  isFirstPost
}: PostFormProps) {
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { countdown, rateLimitError, setRateLimitError } =
    useRateLimitCountdown();

  const plausible = usePlausible();
  
  const trackPostSubmitted = function trackPostSubmitted(characterCount: number) {
    plausible('post_submitted', {
      props: {
        character_count: characterCount,
        is_first_post: isFirstPost,
        infection_count: infectionCount,
        is_masjid: isMasjid
      }
    });
  };

  const trackPostCompleted = function trackPostCompleted(durationMs: number) {
    plausible('post_completed', {
      props: {
        duration_ms: durationMs,
        is_masjid: isMasjid
      }
    });
  };

  const trackPostError = function trackPostError(errorType: 'rate_limit' | 'network_error') {
    plausible('post_error', {
      props: {
        error_type: errorType,
        is_masjid: isMasjid
      }
    });
  };

  const submitPost = async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!postContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const startTime = Date.now();
    
    // Track post submission
    trackPostSubmitted(postContent.length);

    try {
      await axios.post<TPostResponseData>(`/api/v1/${websiteId}/post`, {
        body: postContent
      } satisfies TPostRequestBody);

      await refetchTimelineQuery();

      // Track successful completion
      const duration = Date.now() - startTime;
      trackPostCompleted(duration);

      setPostContent('');
      setRateLimitError(null);
    } catch (error) {
      console.error('Failed to submit post:', error);

      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const errorData = error.response.data;
        const formErrors = errorData?._errors?.formErrors;
        if (formErrors?.length > 0) {
          const formError = formErrors[0];
          if (
            Array.isArray(formError) &&
            formError[0] === 'requestErrors.rateLimitExceeded'
          ) {
            setRateLimitError(formError as [string, { retryAfter: string }]);
            trackPostError('rate_limit');
          }
        }
      } else {
        trackPostError('network_error');
        alert('Failed to submit post. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const userColor = getUserColor(meUserNumber);
  const userInfo = {
    displayName: `Concerned User #${meUserNumber}`,
    className: `${userColor} text-white`,
    content: (
      <>
        <span className="text-[8px] font-semibold align-bottom -translate-x-px translate-y-0.5">
          #
        </span>
        <span className="text-xs font-bold align-middle -translate-x-px">
          {meUserNumber}
        </span>
      </>
    )
  };

  return (
    <>
      {/* Current User Display */}
      <div className="flex items-center gap-3 p-4 sm:p-6 pb-4 text-sm">
        <div
          className={classnames(
            'w-6 h-6 rounded-full flex items-center justify-center text-white font-bold',
            userInfo.className
          )}
        >
          {userInfo.content}
        </div>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {userInfo.displayName}
        </span>
      </div>

      {/* Post Form */}
      <div className="px-4 sm:px-6 pb-4">
        <form onSubmit={submitPost}>
          <div className="flex flex-col gap-3">
            {rateLimitError && countdown > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please wait {countdown} second{countdown !== 1 ? 's' : ''}{' '}
                  before posting again
                </p>
              </div>
            )}
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share what you're doing to help... Know the website owner? Contacted him? Know someone who can help? Any updates on their response?"
              className="w-full p-2 text-sm sm:text-base sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={5}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!postContent.trim() || countdown > 0}
                loading={isSubmitting}
                label={
                  isSubmitting
                    ? 'Posting...'
                    : countdown > 0
                      ? `Wait ${countdown}s`
                      : 'Post Anonymously'
                }
                className=""
              />
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

// New Components

type InteractionLayoutProps = {
  title: string;
  body: React.ReactNode;
  avatar: {
    className: string;
    content: React.ReactNode;
  };
  interaction: TTimelineResponseData['interactions'][number];
  subtitle?: string;
  tint?: 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'gray';
};

function InteractionLayout({
  title,
  body,
  avatar,
  interaction,
  subtitle,
  tint
}: InteractionLayoutProps) {
  const baseClasses =
    'p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 last:border-b-0';

  // Define tint-specific classes
  const tintClasses = {
    yellow: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20',
      title: 'text-yellow-800 dark:text-yellow-200',
      timestamp: 'text-yellow-600 dark:text-yellow-400',
      body: 'text-yellow-700 dark:text-yellow-300'
    },
    green: {
      container: 'bg-green-50 dark:bg-green-900/20',
      title: 'text-green-800 dark:text-green-200',
      timestamp: 'text-green-600 dark:text-green-400',
      body: 'text-green-700 dark:text-green-300'
    },
    blue: {
      container: 'bg-blue-50 dark:bg-blue-900/20',
      title: 'text-blue-800 dark:text-blue-200',
      timestamp: 'text-blue-600 dark:text-blue-400',
      body: 'text-blue-700 dark:text-blue-300'
    },
    purple: {
      container: 'bg-purple-50 dark:bg-purple-900/20',
      title: 'text-purple-800 dark:text-purple-200',
      timestamp: 'text-purple-600 dark:text-purple-400',
      body: 'text-purple-700 dark:text-purple-300'
    },
    red: {
      container: 'bg-red-50 dark:bg-red-900/20',
      title: 'text-red-800 dark:text-red-200',
      timestamp: 'text-red-600 dark:text-red-400',
      body: 'text-red-700 dark:text-red-300'
    },
    gray: {
      container: '',
      title: 'text-gray-900 dark:text-gray-100',
      timestamp: 'text-gray-500 dark:text-gray-400',
      body: 'text-gray-700 dark:text-gray-300'
    }
  };

  const currentTint = tint ? tintClasses[tint] : tintClasses.gray;
  const containerClasses = classnames(baseClasses, currentTint.container);

  return (
    <div className={containerClasses} id={interaction.id.toString()}>
      {/* Mobile: Vertical stack, Desktop: Horizontal layout */}
      <div className="flex flex-col sm:flex-row sm:gap-4">
        {/* First row on mobile: Avatar and date */}
        <div className="flex items-center justify-between mb-2 sm:mb-0 sm:contents">
          <div
            className={classnames(
              'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold sm:flex-shrink-0',
              avatar.className
            )}
          >
            {avatar.content}
          </div>
          <span
            className={classnames('text-sm sm:hidden', currentTint.timestamp)}
          >
            {new Date(interaction.createdAt).toLocaleDateString()} at{' '}
            {new Date(interaction.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Desktop: Title and timestamp on same line */}
          <div className="hidden sm:flex sm:items-center sm:gap-2 sm:mb-0">
            <span className={classnames('font-semibold', currentTint.title)}>
              {title}
            </span>
            <span className={classnames('text-sm', currentTint.timestamp)}>
              {new Date(interaction.createdAt).toLocaleDateString()} at{' '}
              {new Date(interaction.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Mobile: Title on its own row */}
          <div className="sm:hidden mb-2">
            <span className={classnames('font-semibold', currentTint.title)}>
              {title}
            </span>
          </div>

          {subtitle && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {subtitle}
            </div>
          )}

          {/* Body content */}
          <p
            className={classnames(currentTint.body, tint ? 'font-medium' : '', 'whitespace-pre-wrap')}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

type InteractionProps = {
  interaction: TTimelineResponseData['interactions'][number];
  timelineData: TTimelineResponseData;
};

function Interaction({ interaction, timelineData }: InteractionProps) {
  switch (interaction.type) {
    case 'SCAN': {
      assertIsScanInteraction(interaction);

      const scanInteraction = interaction as TTimelineScanInteractionWithNumber;
      const detectedCompanies = getDetectedCompanies(
        scanInteraction.scan.changes
      );
      const hasUserNumberPosted = timelineData.interactions.some(
        function isPostByUserNumber(interaction) {
          return (
            interaction.type === 'POST' &&
            interaction.post.userNumber === scanInteraction.scan.userNumber
          );
        }
      );
      const title = `Scan #${scanInteraction.scan.number}`;
      const subtitle = `${
        hasUserNumberPosted ? 'Concerned' : 'Curious'
      } User #${scanInteraction.scan.userNumber}`;

      let body: React.ReactNode;
      let avatar: { className: string; content: React.ReactNode };

      if (detectedCompanies.length === 0) {
        // Clean scan logic
        const isFirstScan = scanInteraction.scan.number === 1;

        if (isFirstScan) {
          body = '✅ Clean! No Israeli technologies detected';
        } else {
          // Check if any companies were just removed in this scan
          const justRemovedCompanies = timelineData.companies.filter(
            (company) => {
              return company.infections.some(
                (infection) => infection.end === interaction.createdAt
              );
            }
          );

          if (justRemovedCompanies.length > 0) {
            const removalMessages = justRemovedCompanies.map((company) => {
              const companyInfo = COMPANIES.find((c) => c.id === company.id);
              const companyName = companyInfo?.name || company.id;

              const endedInfection = company.infections.find(
                (infection) => infection.end === interaction.createdAt
              );

              if (endedInfection) {
                const firstDetectedDate = new Date(endedInfection.start);
                const currentScanDate = new Date(interaction.createdAt);
                const daysPresentFor = Math.floor(
                  (currentScanDate.getTime() - firstDetectedDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                if (daysPresentFor === 0) {
                  return `${companyName} was removed`;
                } else {
                  return `${companyName} was removed (was subverting this website for ${daysPresentFor} days since detection)`;
                }
              } else {
                return `${companyName} was removed`;
              }
            });

            body = `${removalMessages.join(
              '; '
            )}. Is now safe! No Israeli technologies detected`;
          } else {
            const hasAnyPreviousDetections = timelineData.companies.some(
              (company) => company.infections.length > 0
            );

            if (hasAnyPreviousDetections) {
              body = `Still clean - no Israeli technologies detected (previously had detections)`;
            } else {
              body = `Still clean - no Israeli technologies detected`;
            }
          }
        }

        // Green checkmark for clean scans
        avatar = {
          className: 'bg-green-100',
          content: (
            <svg
              className="w-6 h-6 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )
        };
      } else {
        // Detected companies logic
        const companyDescriptions = detectedCompanies.map((companyId) => {
          const companyDescription = COMPANIES.find((c) => c.id === companyId);
          const companyName = companyDescription?.name || companyId;
          const company = timelineData.companies.find(
            (c) => c.id === companyId
          );
          const activeInfection = company?.infections.find(
            (infection) => infection.end === null
          );

          if (!company || !activeInfection) {
            return `${companyName} detected for the first time`;
          }

          const firstDetectedDate = new Date(activeInfection.start);
          const currentScanDate = new Date(interaction.createdAt);
          const daysSinceFirstDetection = Math.floor(
            (currentScanDate.getTime() - firstDetectedDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          const firstDetectedDateString =
            firstDetectedDate.toLocaleDateString();

          if (daysSinceFirstDetection === 0) {
            const firstDetectedTime = firstDetectedDate.getTime();
            const currentScanTime = currentScanDate.getTime();

            if (firstDetectedTime === currentScanTime) {
              return `${companyName} detected for the first time`;
            } else {
              return `${companyName} still detected - first detected earlier today`;
            }
          } else {
            return `${companyName} still detected - it's been subverting this website owner and visitor data for ${daysSinceFirstDetection} days since detection on ${firstDetectedDateString}`;
          }
        });

        body = companyDescriptions;

        // Red warning for detected scans
        avatar = {
          className: 'bg-red-100',
          content: (
            <svg
              className="w-6 h-6 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )
        };
      }

      return (
        <InteractionLayout
          title={title}
          body={body}
          avatar={avatar}
          interaction={interaction}
          subtitle={subtitle}
        />
      );
    }

    case 'POST': {
      const postInteraction = interaction as TTimelinePostInteractionWithNumber;
      const userColor = getUserColor(postInteraction.post.userNumber);

      return (
        <InteractionLayout
          title={`Concerned User #${postInteraction.post.userNumber}`}
          body={interaction.post?.body || 'No content'}
          avatar={{
            className: `${userColor} text-white`,
            content: (
              <>
                <span className="text-xs font-semibold align-bottom -translate-x-0.5 translate-y-px">
                  #
                </span>
                <span className="text-lg font-bold align-middle -translate-x-0.5">
                  {postInteraction.post.userNumber}
                </span>
              </>
            )
          }}
          interaction={interaction}
        />
      );
    }

    case 'MILESTONE': {
      assertIsMilestoneInteraction(interaction);

      switch (interaction.milestone.data.type) {
        case 'first-scan':
          return (
            <InteractionLayout
              title="Community Milestone"
              body="🔎 First scan!"
              avatar={{
                className: 'bg-purple-500 text-2xl',
                content: '🧐'
              }}
              interaction={interaction}
            />
          );

        case 'user-promoted-to-concerned':
          return (
            <InteractionLayout
              title="Community Milestone"
              body="A curious community member has been promoted to concerned user status by joining the effort with their first post! Thank you for taking action. 🤝"
              avatar={{
                className: 'bg-purple-500 text-2xl',
                content: '🤝'
              }}
              interaction={interaction}
            />
          );

        case 'company-added-first-time':
        case 'company-added-back': {
          const milestoneData = interaction.milestone.data as {
            type: 'company-added-first-time' | 'company-added-back';
            companyId: string;
          };
          const companyInfo = COMPANIES.find(
            (c) => c.id === milestoneData.companyId
          );
          const companyName = companyInfo?.name || milestoneData.companyId;

          return (
            <InteractionLayout
              title={`Detection Alert - ${companyName}`}
              body={`⚠️ ${companyName} detected on this website for the first time.`}
              avatar={{
                className: 'bg-yellow-500 text-2xl',
                content: '😳'
              }}
              interaction={interaction}
              tint="yellow"
            />
          );
        }

        case 'company-removed-and-no-others': {
          const milestoneData = interaction.milestone.data as {
            type: 'company-removed-and-no-others';
            companyId: string;
          };
          const companyInfo = COMPANIES.find(
            (c) => c.id === milestoneData.companyId
          );
          const companyName = companyInfo?.name || milestoneData.companyId;

          return (
            <InteractionLayout
              title="Victory! Website is Clean"
              body={`🎉 Amazing work, community! ${companyName} has been removed and this website is now completely free of Israeli technology. Your activism and outreach efforts have successfully informed the website owner. This is what collective action looks like! 🏆`}
              avatar={{
                className: 'bg-green-500 text-xl',
                content: '🏆'
              }}
              interaction={interaction}
              tint="green"
            />
          );
        }

        case 'company-removed-but-has-others': {
          const milestoneData = interaction.milestone.data as {
            type: 'company-removed-but-has-others';
            companyId: string;
          };
          const companyInfo = COMPANIES.find(
            (c) => c.id === milestoneData.companyId
          );
          const companyName = companyInfo?.name || milestoneData.companyId;

          return (
            <InteractionLayout
              title="Progress Made!"
              body={`🫡 Great progress! ${companyName} has been removed from this website. However, there are still other Israeli technologies detected. Keep up the excellent work - we're getting closer to a completely clean website! 🎈🎈🎈`}
              avatar={{
                className: 'bg-blue-500 text-2xl',
                content: '💪'
              }}
              interaction={interaction}
              tint="blue"
            />
          );
        }

        default:
          assertNever(interaction.milestone.data);
      }
    }

    case 'REPORT': {
      const reportInteraction = interaction as TTimelineReportInteraction;

      // Map reportType to a human-friendly label
      const reportTypeLabels: Record<string, string> = {
        'scan-wrong': 'Scan is wrong (false positive/negative)',
        'scan-right-other-vuln':
          'Scan is correct, but website has other known vulnerabilities',
        'scan-right': 'Scan is correct'
      };
      const subtitle =
        reportTypeLabels[reportInteraction.report.reportType] ||
        reportInteraction.report.reportType;

      return (
        <InteractionLayout
          title={`Reported By: Concerned User #${reportInteraction.report.userNumber}`}
          body={interaction.report?.message || 'No content'}
          avatar={{
            className: 'bg-yellow-500 text-white',
            content: (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )
          }}
          interaction={interaction}
          subtitle={subtitle}
        />
      );
    }

    default:
      assertNever(interaction);
  }
}

// Generate a consistent color for a user based on their number
function getUserColor(userNumber: number): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];
  return colors[(userNumber - 1) % colors.length];
}

export default Timeline;
