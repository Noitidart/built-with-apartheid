import { COMPANIES } from '@/constants/companies';
import { assertNever } from '@/lib/typescript';
import type {
  TPostRequestBody,
  TPostResponseData
} from '@/pages/api/v1/[websiteId]/post';
import type { TTimelineResponseData } from '@/pages/api/v1/[websiteId]/timeline';
import { assertIsMilestoneInteraction } from '@/types/interaction';
import type { TWebsite } from '@/types/website';
import { getCurrentUserId } from '@/utils/user-utils';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import classnames from 'classnames';
import { PartyPopperIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useState } from 'react';

type TimelineProps = {
  website: Pick<TWebsite, 'id'>;
};

function Timeline({ website }: TimelineProps) {
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timelineQuery = useTimelineQuery(website.id);

  const submitPost = async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!postContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const userId = getCurrentUserId();

      await axios.post<TPostResponseData>(`/api/v1/${website.id}/post`, {
        body: postContent,
        userId
      } satisfies TPostRequestBody);

      setPostContent('');
      // Refetch timeline after posting
      timelineQuery.refetch();
    } catch (error) {
      console.error('Failed to submit post:', error);
      alert('Failed to submit post. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current user info for the post form
  const getCurrentUserInfo = function getCurrentUserInfo() {
    if (!data) return null;

    const currentUserId = getCurrentUserId();
    const currentUser = data.users[currentUserId];

    if (currentUser) {
      return {
        userId: currentUserId,
        displayName: `${
          currentUser.type === 'curious' ? 'Curious' : 'Concerned'
        } User #${currentUser.number}`,
        color: getUserColor(currentUserId, data.users)
      };
    }

    // If user hasn't interacted yet, they would be the next curious user
    const curiousUserCount = Object.values(data.users).filter(
      (user) => user.type === 'curious'
    ).length;
    return {
      userId: currentUserId,
      displayName: `Curious User #${curiousUserCount + 1}`,
      color: 'bg-blue-500'
    };
  };

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
          Failed to load community timeline. Please try again later.
        </p>
      </div>
    );
  }

  const data = timelineQuery.data;
  if (!data) {
    return null;
  }

  // Calculate community stats
  const totalScans = Object.keys(data.scans).length;
  const totalConcernedUsers = Object.values(data.users).filter(
    (user) => user.type === 'concerned'
  ).length;

  return (
    <div className="w-full space-y-6">
      <ActiveCompanyList
        companies={data.companies}
        totalScans={totalScans}
        totalConcernedUsers={totalConcernedUsers}
      />

      {/* Community Timeline Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-2">Community Timeline</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Share your outreach efforts and coordinate with others to help
            inform the owners of this website to transition away or keep away
            from Israeli technology.
          </p>
        </div>

        {/* Post Form Section */}
        <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          {/* Current User Display */}
          <div className="flex items-center gap-3 p-6 pb-4 text-sm">
            <div
              className={classnames(
                'w-6 h-6 rounded-full flex items-center justify-center text-white font-bold',
                getCurrentUserInfo()?.color || 'bg-blue-500'
              )}
            >
              C
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {getCurrentUserInfo()?.displayName || 'Curious User #1387'}
            </span>
          </div>

          {/* Post Form */}
          <div className="px-6 pb-6">
            <form onSubmit={submitPost}>
              <div className="flex flex-col gap-3">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share what you're doing to help... Have you contacted them? Know someone who can help? Any updates on their response?"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                  rows={3}
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!postContent.trim() || isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Sharing...' : 'Share Update'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Timeline Entries */}
        <div>
          <AnimatePresence>
            {data.interactions.map((interaction, index) => (
              <motion.div
                key={interaction.id}
                className="flex gap-4 p-6 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {/* Icon */}
                {getInteractionIcon(interaction, data.users)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {interaction.type === 'SCAN' && interaction.scan
                        ? `Scan #${data.scans[interaction.id]?.number}`
                        : interaction.type === 'MILESTONE'
                        ? 'Community Milestone'
                        : interaction.userId
                        ? getUserDisplayName(interaction.userId, data.users)
                        : 'System'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(interaction.createdAt).toLocaleDateString()} at{' '}
                      {new Date(interaction.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {interaction.type === 'SCAN' && interaction.userId
                      ? `by ${getUserDisplayName(
                          interaction.userId,
                          data.users
                        )}`
                      : ''}
                  </div>

                  <p className="text-gray-700 dark:text-gray-300">
                    {formatInteractionContent(interaction, data)}
                  </p>
                </div>
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

function getUserDisplayName(
  userId: string,
  users: TTimelineResponseData['users']
): string {
  const user = users[userId];
  if (!user) return 'System';

  const userType = user.type === 'curious' ? 'Curious' : 'Concerned';
  return `${userType} User #${user.number}`;
}

function getUserColor(
  userId: string,
  users: TTimelineResponseData['users']
): string {
  const user = users[userId];
  if (!user) return 'bg-gray-500';

  // Generate consistent colors based on user number and type
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-teal-500'
  ];

  const baseIndex = (user.number - 1) % colors.length;
  return colors[baseIndex];
}

function formatInteractionContent(
  interaction: TTimelineResponseData['interactions'][0],
  data: TTimelineResponseData
): string {
  switch (interaction.type) {
    case 'SCAN':
      const detectedCompanies = getDetectedCompanies(interaction.scan?.changes);

      if (detectedCompanies.length === 0) {
        // Check if this is the first scan ever
        const scanData = data?.scans[interaction.id];
        const isFirstScan = scanData?.number === 1;

        if (isFirstScan) {
          return '✅ Clean! No Israeli technologies detected';
        } else {
          // Check if any companies were just removed in this scan
          // We need to look at the companies array and check their infections
          const justRemovedCompanies = data.companies.filter((company) => {
            // Find if this company had an active infection that ended at this scan time
            return company.infections.some(
              (infection) => infection.end === interaction.createdAt
            );
          });

          if (justRemovedCompanies.length > 0) {
            const removalMessages = justRemovedCompanies.map((company) => {
              const companyInfo = COMPANIES.find((c) => c.id === company.id);
              const companyName = companyInfo?.name || company.id;

              // Find the infection that just ended
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

                const firstDetectedDateString =
                  firstDetectedDate.toLocaleDateString();

                if (daysPresentFor === 0) {
                  return `${companyName} was removed (was detected earlier today on ${firstDetectedDateString})`;
                } else if (daysPresentFor === 1) {
                  return `${companyName} was removed (was subverting this website for 1 day since detection on ${firstDetectedDateString})`;
                } else {
                  return `${companyName} was removed (was subverting this website for ${daysPresentFor} days since detection on ${firstDetectedDateString})`;
                }
              } else {
                return `${companyName} was removed`;
              }
            });

            return `${removalMessages.join(
              '; '
            )}. Is now safe! No Israeli technologies detected`;
          } else {
            // Check if any companies were ever detected before this scan
            const hasAnyPreviousDetections = data.companies.some(
              (company) => company.infections.length > 0
            );

            if (hasAnyPreviousDetections) {
              return `Still clean - no Israeli technologies detected (previously had detections)`;
            } else {
              return `Still clean - no Israeli technologies detected`;
            }
          }
        }
      }

      // Get company descriptions for detected companies
      const companyDescriptions = detectedCompanies.map((companyId) => {
        const companyDescription = COMPANIES.find((c) => c.id === companyId);
        const companyName = companyDescription?.name || companyId;

        const company = data.companies.find((c) => c.id === companyId);

        // Find the active infection for this company
        const activeInfection = company?.infections.find(
          (infection) => infection.end === null
        );

        // If no company data or no active infection, this is a first detection
        if (!company || !activeInfection) {
          return `${companyName} detected for the first time`;
        }

        // Calculate days since first detection using the scan date, not current time
        const firstDetectedDate = new Date(activeInfection.start);
        const currentScanDate = new Date(interaction.createdAt);
        const daysSinceFirstDetection = Math.floor(
          (currentScanDate.getTime() - firstDetectedDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const firstDetectedDateString = firstDetectedDate.toLocaleDateString();

        // Handle same-day detections
        if (daysSinceFirstDetection === 0) {
          const firstDetectedTime = firstDetectedDate.getTime();
          const currentScanTime = currentScanDate.getTime();

          // If it's the exact same time, it's the first detection
          if (firstDetectedTime === currentScanTime) {
            return `${companyName} detected for the first time`;
          } else {
            return `${companyName} still detected - first detected earlier today`;
          }
        } else if (daysSinceFirstDetection === 1) {
          return `${companyName} still detected - it's been subverting this website owner and visitor data since yesterday`;
        } else {
          return `${companyName} still detected - it's been subverting this website owner and visitor data for ${daysSinceFirstDetection} days since detection on ${firstDetectedDateString}`;
        }
      });

      return companyDescriptions.join('; ');

    case 'POST':
      return interaction.post?.body || 'No content';

    case 'MILESTONE': {
      assertIsMilestoneInteraction(interaction);

      switch (interaction.milestone.data.type) {
        case 'first-scan':
          return '🔎 First scan!';
        case 'user-promoted-to-concerned':
          return 'A curious community member has been promoted to concerned user status by joining the effort with their first post! Thank you for taking action. 🎉';
        case 'company-added-first-time':
        case 'company-removed-but-has-others':
        case 'company-removed-and-no-others':
        case 'company-added-back':
          // Handle these milestone types
          return `Milestone: ${interaction.milestone.data.type}`;
        default:
          assertNever(interaction.milestone.data);
      }
    }
    default:
      return 'Unknown interaction';
  }
}

function getInteractionIcon(
  interaction: TTimelineResponseData['interactions'][0],
  users: TTimelineResponseData['users']
) {
  if (interaction.type === 'SCAN') {
    const detectedCompanies = getDetectedCompanies(interaction.scan?.changes);
    if (detectedCompanies.length === 0) {
      // Clean scan - green checkmark
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
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
        </div>
      );
    } else {
      // Detected scan - red warning
      return (
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
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
        </div>
      );
    }
  }

  if (interaction.type === 'POST' && interaction.userId) {
    const userColor = getUserColor(interaction.userId, users);
    return (
      <div
        className={classnames(
          'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold',
          userColor
        )}
      >
        C
      </div>
    );
  }

  if (interaction.type === 'MILESTONE') {
    return (
      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
        <PartyPopperIcon className="w-6 h-6 text-purple-100" />
      </div>
    );
  }

  // Default system icon
  return (
    <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
      <span className="text-white text-sm">•</span>
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

function useTimelineQuery(websiteId: number) {
  return useQuery({
    queryKey: ['timeline', websiteId],
    queryFn: async function fetchTimeline() {
      const response = await axios.get<TTimelineResponseData>(
        `/api/v1/${websiteId}/timeline`
      );
      return response.data;
    },
    enabled: !!websiteId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    notifyOnChangeProps: ['data', 'status', 'error', 'isFetching']
  });
}

type TTimelineCompany = TTimelineResponseData['companies'][number];

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
  totalConcernedUsers: number;
};

const ActiveCompanyList = memo(function ActiveCompanyList({
  companies,
  totalScans,
  totalConcernedUsers
}: ActiveCompanyListProps) {
  const activeCompanies = companies.filter(isActive);

  if (activeCompanies.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
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
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Still using {companyInfo?.name || company.id}
                  {wasEverRemoved ? ' (added back after removal)' : ''}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  First detected on{' '}
                  {firstDetectedAt
                    ? new Date(firstDetectedAt).toLocaleDateString()
                    : 'Unknown'}{' '}
                  • {totalScans} community scans • {totalConcernedUsers} people
                  taking action
                </p>
              </div>
              <div className="text-center bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg">
                <div className="text-2xl font-bold">
                  {daysSinceFirst === 0 ? 'Today' : `Day ${daysSinceFirst + 1}`}
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

export default Timeline;
