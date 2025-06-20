import { getCurrentUserId } from '@/utils/user-utils';
import { Bell, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface WatchedSite {
  id: number;
  hostname: string;
  lastScan: {
    date: string;
    hasIsraeliTech: boolean;
  } | null;
}

export default function WatchedSites() {
  const [watchedSites, setWatchedSites] = useState<WatchedSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWatchedSites = async (retryCount = 0) => {
      const userId = getCurrentUserId();
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/users/${userId}/watched-sites`);
        if (response.ok) {
          const data = (await response.json()) as { sites: WatchedSite[] };
          console.log(data);
          setWatchedSites(data.sites);
          setError(null);
        } else {
          const data = await response.json();
          if (response.status === 503 && retryCount < 3) {
            // Wait for 5 seconds before retrying
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return fetchWatchedSites(retryCount + 1);
          }
          throw new Error(
            (data as { error?: string })?.error ||
              'Failed to fetch watched sites'
          );
        }
      } catch (error) {
        console.error('Failed to fetch watched sites:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchedSites();
  }, []);

  if (watchedSites.length === 0 && !isLoading && !error) {
    return null;
  }

  return (
    <div
      className={`fixed right-0 top-0 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-300 z-50 ${
        isExpanded ? 'w-80' : 'w-12'
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isExpanded ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      <div className={`h-full ${isExpanded ? 'block' : 'hidden'}`}>
        {isLoading ? (
          <div className="p-4 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-200 dark:bg-slate-700 rounded"
                ></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Sites You&apos;re Watching
            </h2>
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {watchedSites.map((site) => (
                <div
                  key={site.id}
                  className="p-3 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                  <div>
                    <Link
                      href={`/${site.hostname}`}
                      className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2"
                    >
                      {site.hostname}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {site.lastScan ? (
                        <>
                          Last scanned:{' '}
                          {new Date(site.lastScan.date).toLocaleDateString()} -{' '}
                          <span
                            className={
                              site.lastScan.hasIsraeliTech
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }
                          >
                            {site.lastScan.hasIsraeliTech
                              ? 'Israeli Tech Detected'
                              : 'Clean'}
                          </span>
                        </>
                      ) : (
                        'No scans yet'
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isExpanded && (
        <div className="h-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
      )}

      {error && (
        <div className="p-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
