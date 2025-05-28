import { useActivityQuery } from '@/hooks/useActivityQuery';
import classnames from 'classnames';
import { motion } from 'motion/react';
import Link from 'next/link';
import { memo } from 'react';

type TActivityTablesProps = {
  className?: string;
};

const ActivityTables = memo(function ActivityTables(
  props: TActivityTablesProps
) {
  const activityQuery = useActivityQuery();

  if (activityQuery.isLoading) {
    return (
      <div className={props.className}>
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
    );
  }

  if (activityQuery.error || !activityQuery.data) {
    return (
      <div className={props.className}>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Unable to load community activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={props.className}>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ActivityTable
          title="Recent Posts"
          subtitle="Latest outreach efforts"
          icon="💬"
          items={activityQuery.data.recentPosts.map((post) => ({
            id: post.id,
            title: post.body,
            websiteHostname: post.website.hostname,
            createdAt: post.createdAt,
            barColor: 'blue',
            titleColor: 'gray',
            clamped: true
          }))}
          delayFactor={0.1}
          noItemsMessage="No recent posts"
        />

        <ActivityTable
          title="Recent Detections"
          subtitle="Newly found Israeli tech"
          icon="⚠️"
          items={activityQuery.data.recentDetections.map((detection) => ({
            id: detection.id,
            title: detection.companyName,
            websiteHostname: detection.website.hostname,
            createdAt: detection.createdAt,
            barColor: 'red',
            titleColor: 'red',
            bolded: true
          }))}
          delayFactor={0.2}
          noItemsMessage="No recent detections"
        />

        <ActivityTable
          title="Recent Removals"
          subtitle="Successful community efforts"
          icon="🎉"
          items={activityQuery.data.recentRemovals.map((removal) => ({
            id: removal.id,
            title: `${removal.companyName} removed`,
            websiteHostname: removal.website.hostname,
            createdAt: removal.createdAt,
            barColor: 'green',
            titleColor: 'green',
            bolded: true
          }))}
          delayFactor={0.3}
          noItemsMessage="No recent removals"
        />

        <ActivityTable
          title="Community Milestones"
          subtitle="First scans and new concerned users"
          icon="🏆"
          delayFactor={0.4}
          className="md:col-span-2 lg:col-span-3"
          gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          noItemsMessage="No recent milestones"
          items={activityQuery.data.recentMilestones.map((milestone) => ({
            id: milestone.id,
            title: formatMilestoneType(milestone.type),
            websiteHostname: milestone.website.hostname,
            createdAt: milestone.createdAt,
            barColor: 'purple',
            titleColor: 'purple',
            bolded: true
          }))}
        />
      </motion.div>
    </div>
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

function formatMilestoneType(type: string): string {
  switch (type) {
    case 'first-scan':
      return '🔎 First scan';
    case 'user-promoted-to-concerned':
      return '🤝 New concerned user';
    default:
      return type;
  }
}

export default ActivityTables;
