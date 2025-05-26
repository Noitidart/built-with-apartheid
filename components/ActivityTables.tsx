import { useActivityQuery } from '@/hooks/useActivityQuery';
import { motion } from 'motion/react';
import Link from 'next/link';
import { memo } from 'react';

type ActivityTablesProps = {
  className?: string;
};

function ActivityTables({ className }: ActivityTablesProps) {
  const activityQuery = useActivityQuery();

  if (activityQuery.isLoading) {
    return (
      <div className={className}>
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
      <div className={className}>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Unable to load community activity</p>
        </div>
      </div>
    );
  }

  const { recentPosts, recentDetections, recentRemovals, recentMilestones } =
    activityQuery.data;

  return (
    <div className={className}>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Recent Posts */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <span className="mr-2">💬</span>
              Recent Posts
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Latest outreach efforts
            </p>
          </div>
          <div className="p-6">
            {recentPosts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No recent posts
              </p>
            ) : (
              <div className="space-y-4">
                {recentPosts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="border-l-2 border-blue-200 dark:border-blue-800 pl-3"
                  >
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                      {post.body}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Link
                        href={`/${post.website.hostname}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 underline"
                      >
                        {post.website.hostname}
                      </Link>
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Detections */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <span className="mr-2">⚠️</span>
              Recent Detections
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Newly found Israeli tech
            </p>
          </div>
          <div className="p-6">
            {recentDetections.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No recent detections
              </p>
            ) : (
              <div className="space-y-4">
                {recentDetections.slice(0, 5).map((detection) => (
                  <div
                    key={detection.id}
                    className="border-l-2 border-red-200 dark:border-red-800 pl-3"
                  >
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      {detection.companyName}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Link
                        href={`/${detection.website.hostname}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 underline"
                      >
                        {detection.website.hostname}
                      </Link>
                      <span>{formatTimeAgo(detection.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Removals */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <span className="mr-2">🎉</span>
              Recent Removals
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Successful community efforts
            </p>
          </div>
          <div className="p-6">
            {recentRemovals.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No recent removals
              </p>
            ) : (
              <div className="space-y-4">
                {recentRemovals.slice(0, 5).map((removal) => (
                  <div
                    key={removal.id}
                    className="border-l-2 border-green-200 dark:border-green-800 pl-3"
                  >
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      {removal.companyName} removed
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Link
                        href={`/${removal.website.hostname}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 underline"
                      >
                        {removal.website.hostname}
                      </Link>
                      <span>{formatTimeAgo(removal.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Milestones - spans full width on larger screens */}
        <motion.div
          className="md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <span className="mr-2">🏆</span>
              Community Milestones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              First scans and new concerned users
            </p>
          </div>
          <div className="p-6">
            {recentMilestones.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No recent milestones
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentMilestones.slice(0, 6).map((milestone) => (
                  <div
                    key={milestone.id}
                    className="border-l-2 border-purple-200 dark:border-purple-800 pl-3"
                  >
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      {formatMilestoneType(milestone.type)}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Link
                        href={`/${milestone.website.hostname}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 underline"
                      >
                        {milestone.website.hostname}
                      </Link>
                      <span>{formatTimeAgo(milestone.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

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
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString();
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

export default memo(ActivityTables);
