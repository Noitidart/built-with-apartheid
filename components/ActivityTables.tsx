import { COMPANIES } from '@/constants/companies';
import { useActivityQuery } from '@/hooks/useActivityQuery';
import { assertNever } from '@/lib/typescript';
import classnames from 'classnames';
import { sample } from 'lodash';
import { motion } from 'motion/react';
import Link from 'next/link';
import { memo, useState } from 'react';

function StatsShimmer() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
      </div>
      <div className="flex items-center justify-center space-x-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-52 animate-pulse"></div>
      </div>
    </div>
  );
}

const SITE_SLOGANS = [
  'Online security, offline impact!',
  'Digital dignity, real-world impact!',
  'Breaking online apartheid!'
];

const MOVEMENT_SLOGANS = [
  'Decolonizing the web!',
  'Shattering apartheid!',
  'Dismantling apartheid, bit by bit!',
  'Digitally resisting!'
];

function StatsDisplay({
  scans7d,
  uniquePosters7d
}: {
  scans7d: { total: number; new: number };
  uniquePosters7d: { total: number; new: number };
}) {
  // State in case in future I want to animate swap through these slogans
  const [siteSlogan] = useState(sample(SITE_SLOGANS));
  const [movementSlogan] = useState(sample(MOVEMENT_SLOGANS));

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-x-2 text-xl font-bold flex flex-col md:flex-row items-center justify-center bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent animate-gradient-sweep">
        <div className="flex items-center">
          <span
            // * "text-black" - so it doesn't get the gradient
            className="text-black -translate-y-0.5 mr-1.5"
          >
            🎯
          </span>

          <span>{scans7d.total} scans this week</span>
        </div>

        <span className="hidden md:block">•</span>

        <span>{scans7d.new} new websites</span>

        <span className="hidden md:block text-gray-900 dark:text-gray-100">
          •
        </span>

        <span className="inline-block align-middle text-gray-900 dark:text-gray-100">
          {siteSlogan}
        </span>
      </div>

      <div className="text-center space-x-2 text-lg font-semibold flex flex-col md:flex-row items-center justify-center bg-gradient-to-r from-pink-400 to-rose-600 bg-clip-text text-transparent animate-gradient-sweep">
        <div className="flex items-center">
          <span
            // * "text-black" - so it doesn't get the gradient
            className="text-black -translate-y-px mr-2"
          >
            👥
          </span>

          <span>{uniquePosters7d.total} people reached out</span>
        </div>

        <span className="hidden md:block">•</span>

        <span>{uniquePosters7d.new} first-timers</span>

        <span className="hidden md:block text-gray-900 dark:text-gray-100">
          •
        </span>

        <span className="inline-block align-middle text-gray-900 dark:text-gray-100">
          {movementSlogan}
        </span>
      </div>
    </motion.div>
  );
}

const ActivityTables = memo(function ActivityTables() {
  const activityQuery = useActivityQuery();

  const header = (
    <div className="mb-6">
      {activityQuery.isLoading ? (
        <StatsShimmer />
      ) : activityQuery.data ? (
        <StatsDisplay
          scans7d={activityQuery.data.scans7d}
          uniquePosters7d={activityQuery.data.uniquePosters7d}
        />
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Unable to load community stats
        </p>
      )}
    </div>
  );

  if (activityQuery.isLoading) {
    return (
      <>
        {header}

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (activityQuery.error || !activityQuery.data) {
    return (
      <>
        {header}

        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Unable to load community activity</p>
        </div>
      </>
    );
  }

  return (
    <>
      {header}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ActivityTable
          title="Recent Posts"
          subtitle="People taking action for change"
          icon="💬"
          items={activityQuery.data.websitesWithPostStats.map((website) => ({
            id: website.id,
            title: (function getRecentPostActivityTitle() {
              if (website.users7d.total === 1) {
                return '✊ First outreach started';
              } else if (website.users7d.new > 0) {
                return `🌟 ${website.users7d.new} new voices joined!`;
              } else {
                return `🔄 Campaign growing ${website.posts7d.total} new posts`;
              }
            })(),
            websiteHostname: website.hostname,
            createdAt: website.latestPostCreatedAt,
            barColor: 'blue',
            titleColor: 'gray',
            clamped: true
          }))}
          delayFactor={0.1}
          noItemsMessage="None yet"
        />

        <ActivityTable
          title="Team Effort Spotlight"
          subtitle="Campaigns making a difference"
          icon="⭐"
          items={activityQuery.data.spotlightedWebsites.map((website) => ({
            id: website.id,
            title: (function getSpotlightedWebsiteTitle() {
              if (website.engagementLevel === 'solo') {
                return '🙏 1 person needs help RIGHT NOW';
              } else if (website.engagementLevel === 'high') {
                return `🔥 ${website.uniquePosterCount} people are looking for help`;
              } else if (website.engagementLevel === 'inactive') {
                return `📢 More voice needed`;
              } else {
                assertNever(website.engagementLevel);
              }
            })(),
            websiteHostname: website.hostname,
            createdAt: new Date(
              website.lastPostCreatedAt || Date.now()
            ).toISOString(),
            barColor: 'red',
            titleColor: 'red',
            bolded: true
          }))}
          delayFactor={0.2}
          noItemsMessage="No spotlights currently"
        />

        <ActivityTable
          title="Victory Board"
          subtitle="Successful community efforts"
          icon="🎉"
          items={activityQuery.data.removalMilestones.map(
            function mapRemovalMilestoneToActivityItem(milestone) {
              const removedCompany = COMPANIES.find(
                (company) => company.id === milestone.data.companyId
              );
              if (!removedCompany) {
                console.error('Company not found for removal milestone', {
                  milestone,
                  companies: COMPANIES
                });

                throw new Error('Company not found for removal milestone');
              }

              return {
                id: milestone.id,
                title: `${removedCompany.name} removed`,
                websiteHostname: milestone.website.hostname,
                createdAt: new Date(milestone.createdAt).toISOString(),
                barColor: 'green',
                titleColor: 'green',
                bolded: true
              };
            }
          )}
          delayFactor={0.3}
          noItemsMessage="None yet"
        />
      </motion.div>
    </>
  );
});

type TActivityItem = {
  id: number;
} & TActivityItemProps;

type TActivityTableProps = {
  title: string;
  subtitle: string;
  icon: string;
  items: TActivityItem[];
  delayFactor?: number;
  className?: string;
  gridClassName?: string;
  noItemsMessage: string;
};

function ActivityTable({
  title,
  subtitle,
  icon,
  items,
  delayFactor = 0.1,
  className = '',
  gridClassName = 'space-y-4',
  noItemsMessage
}: TActivityTableProps) {
  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delayFactor }}
    >
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <span className="mr-2">{icon}</span>

          {title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      </div>

      <div className="p-4 sm:p-6">
        {items.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {noItemsMessage}
          </p>
        ) : (
          <div className={gridClassName}>
            {items.map((item) => (
              <ActivityItem key={item.id} {...item} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// prettier-ignore
const BAR_COLOR_CLASSES = {
  blue: 'border-blue-200 dark:border-blue-800 hover:border-blue-500',
  red: 'border-red-200 dark:border-red-800 hover:border-red-500',
  green: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-500',
  purple: 'border-purple-200 dark:border-purple-800 hover:border-purple-500',
  yellow: 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-500',
  orange: 'border-orange-200 dark:border-orange-800 hover:border-orange-500',
  pink: 'border-pink-200 dark:border-pink-800 hover:border-pink-500',
  gray: 'border-gray-200 dark:border-gray-800 hover:border-gray-500',
  teal: 'border-teal-200 dark:border-teal-800 hover:border-teal-500',
  indigo: 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-500'
};

const TITLE_COLOR_CLASSES = {
  red: 'text-red-700 dark:text-red-300',
  green: 'text-green-700 dark:text-green-300',
  purple: 'text-purple-700 dark:text-purple-300',
  gray: 'text-gray-900 dark:text-gray-100'
};

type TActivityItemProps = {
  title: string;
  websiteHostname: string;
  createdAt: string;
  barColor: keyof typeof BAR_COLOR_CLASSES;
  titleColor: keyof typeof TITLE_COLOR_CLASSES;
  bolded?: boolean;
  clamped?: boolean;
};

const ActivityItem = memo(function ActivityItem(props: TActivityItemProps) {
  const titleClasses = classnames(
    'text-sm',
    props.bolded && 'font-medium',
    props.clamped && 'line-clamp-2',
    TITLE_COLOR_CLASSES[props.titleColor]
  );

  return (
    <Link
      href={`/${props.websiteHostname}`}
      className={classnames(
        'group block border-l-2 pl-3',
        BAR_COLOR_CLASSES[props.barColor]
      )}
    >
      <p className={titleClasses}>{props.title}</p>

      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 underline">
          {props.websiteHostname}
        </span>

        <span>{formatTimeAgo(props.createdAt)}</span>
      </div>
    </Link>
  );
});

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 14) {
    return `${diffInDays}d ago`;
  } else if (diffInDays < 49) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return `${months}m ago`;
  }
}

export default ActivityTables;
