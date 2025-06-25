import type { TWatchedSitesResponseData } from '@/pages/api/v1/websites/watched';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import classnames from 'classnames';
import { BellIcon, ChevronRightIcon, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

function WatchedSitesSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data, isLoading, error } = useWatchedSitesQuery();

  const watchedSites = data?.websites || [];

  return (
    <div
      className={classnames(
        'fixed right-0 top-0 h-full bg-white dark:bg-slate-900',
        'border-l border-slate-200 dark:border-slate-700 shadow-lg',
        'transition-transform duration-300 z-50',
        'w-80 md:w-80', // Full width on mobile when expanded
        {
          'translate-x-full': !isExpanded, // Completely hide on mobile when collapsed
          'md:translate-x-[268px]': !isExpanded // Partial hide on desktop
        }
      )}
    >
      <div
        className={classnames(
          'h-full',
          'transition-opacity duration-300',
          isExpanded ? 'opacity-100 delay-150' : 'opacity-0'
        )}
      >
        <h2 className="text-xl font-semibold pl-8 md:px-4 pt-5 md:pt-8 pb-4">
          Sites You&apos;re Watching
        </h2>

        {isLoading ? (
          <div className="space-y-3 animate-pulse px-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-200 dark:bg-slate-700 rounded"
              ></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)] px-4">
            {watchedSites.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p className="text-sm">
                  You aren&apos;t watching any sites yet.
                </p>
                <p className="text-xs mt-2">
                  Click the watch button on any site to get notified of changes.
                </p>
              </div>
            ) : (
              watchedSites.map((site) => (
                <Link
                  key={site.id}
                  href={`/${site.hostname}`}
                  onClick={() => setIsExpanded(false)}
                  className={classnames(
                    'block p-3 rounded-lg border',
                    'bg-white dark:bg-slate-800',
                    'border-slate-200 dark:border-slate-700',
                    'hover:bg-slate-50 dark:hover:bg-slate-700',
                    'hover:border-slate-300 dark:hover:border-slate-600',
                    'transition-colors cursor-pointer',
                    'group'
                  )}
                >
                  <div
                    className={classnames(
                      'text-sm font-medium',
                      'flex items-center gap-2',
                      'group-hover:underline'
                    )}
                  >
                    {site.hostname}
                    <ExternalLinkIcon className="w-3 h-3" />
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                    <p>
                      Last scan:{' '}
                      {site.lastScan
                        ? new Date(site.lastScan.createdAt).toLocaleDateString()
                        : '–'}
                      {site.lastScan && site.lastScan.infected && (
                        <>
                          {' '}
                          <span className="text-red-600 dark:text-red-400">
                            (Still Infected)
                          </span>
                        </>
                      )}
                    </p>

                    <p>Total posts: {site.totalPosts || 'No posts yet'}</p>

                    {site.lastPostCreatedAt && (
                      <p>
                        Last post:{' '}
                        {new Date(site.lastPostCreatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 pb-4 text-red-600 dark:text-red-400 text-sm">
          {axios.isAxiosError(error)
            ? error.response?.data?.error || error.message
            : 'An error occurred'}
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={classnames(
          'absolute',
          'bg-white dark:bg-slate-900',
          'border border-slate-200 dark:border-slate-700',
          'rounded-full shadow-md',
          'hover:bg-slate-50 dark:hover:bg-slate-800',
          'transition-transform duration-300',
          isExpanded
            ? 'top-4 -left-4 md:top-1/2 md:-translate-y-1/2 md:-left-5'
            : 'top-4 -left-14 md:top-1/2 md:-translate-y-1/2 md:-left-5',
          isExpanded ? 'p-2' : 'p-3'
        )}
        title={
          isExpanded
            ? 'Collapse sidebar of your watched sites'
            : 'Expand sidebar of your watched sites'
        }
      >
        {isExpanded ? (
          <ChevronRightIcon className="w-5 h-5" />
        ) : (
          <BellIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

export default WatchedSitesSidebar;

// Query signature function
export function getWatchedSitesQuerySignature() {
  return {
    queryKey: ['watchedSites'],
    queryFn: async function fetchWatchedSites() {
      const response = await axios.get<TWatchedSitesResponseData>(
        '/api/v1/websites/watched'
      );
      return response.data;
    }
  };
}

// Custom hook for watched sites query
function useWatchedSitesQuery() {
  return useQuery({
    ...getWatchedSitesQuerySignature(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    gcTime: 60_000,
    notifyOnChangeProps: ['data', 'status', 'error', 'isFetching']
  });
}
