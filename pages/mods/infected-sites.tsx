import LoginProtectedLayout from '@/components/LoginProtectedLayout';
import Spinner from '@/components/Spinner';
import { getLoginLayoutServerSideProps } from '@/lib/login-layout.backend';
import type { TGetInfectedSitesResponseData } from '@/pages/api/v1/mods/infected-sites';
import type { TMe } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertTriangle, ChevronDown, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

export const getServerSideProps = getLoginLayoutServerSideProps;

type TInfectedSitesPageProps = Awaited<
  ReturnType<typeof getServerSideProps>
>['props'];

function InfectedSitesPage(_props: TInfectedSitesPageProps) {
  return (
    <LoginProtectedLayout
      title="Infected Sites Monitor"
      subtitle="Moderator Dashboard"
      subtitleHref="/mods"
      ContentComponent={InfectedSitesContent}
    />
  );
}

type TInfectedSitesContentProps = {
  me: TMe;
};

function InfectedSitesContent(_props: TInfectedSitesContentProps) {
  const router = useRouter();
  const showMasjidsOnly = router.query.masjids === 'true';
  const sortBy = (router.query.sort as string) || 'activity-high';
  const timeRange = (router.query.range as string) || '24h';
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const infectedSitesQuery = useInfectedSitesQuery({
    showMasjidsOnly,
    sortBy,
    timeRange
  });

  function toggleRowExpanded(siteId: number) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(siteId)) {
      newExpanded.delete(siteId);
    } else {
      newExpanded.add(siteId);
    }
    setExpandedRows(newExpanded);
  }

  function updateUrlParams(updates: {
    masjids?: string;
    sort?: string;
    range?: string;
  }) {
    const newQuery = { ...router.query };

    if (updates.masjids !== undefined) {
      if (updates.masjids === 'false') {
        delete newQuery.masjids;
      } else {
        newQuery.masjids = updates.masjids;
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort === 'activity-high') {
        delete newQuery.sort;
      } else {
        newQuery.sort = updates.sort;
      }
    }

    if (updates.range !== undefined) {
      if (updates.range === '24h') {
        delete newQuery.range;
      } else {
        newQuery.range = updates.range;
      }
    }

    router.push(
      {
        pathname: router.pathname,
        query: newQuery
      },
      undefined,
      { shallow: true }
    );
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateUrlParams({ sort: e.target.value });
  }

  function handleTimeRangeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateUrlParams({ range: e.target.value });
  }

  return (
    <div className="container mx-auto">
      {/* Stats Overview */}
      {infectedSitesQuery.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Total Infected Sites
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {infectedSitesQuery.data.stats.totalInfectedSites}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Anonymous Users
            </h3>
            <p className="text-2xl font-bold">
              {infectedSitesQuery.data.stats.anonymousUsers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Known Users
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {infectedSitesQuery.data.stats.registeredUsers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Recent Activity ({timeRange === 'all' ? 'All Time' : timeRange === '1m' ? '1 Month' : timeRange === '7d' ? '7 Days' : '24 Hours'})
            </h3>
            <p className="text-2xl font-bold">
              {infectedSitesQuery.data.stats.recentActivity}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div>
          <label htmlFor="timeRange" className="block text-sm font-medium mb-1">
            Activity Period
          </label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="1m">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium mb-1">
            Sort By
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={handleSortChange}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="activity-high">Activity: High to Low</option>
            <option value="activity-low">Activity: Low to High</option>
            <option value="posts-high">Posts: High to Low</option>
            <option value="posts-low">Posts: Low to High</option>
            <option value="views-high">Views: High to Low</option>
            <option value="views-low">Views: Low to High</option>
            <option value="viewers-high">Viewers: High to Low</option>
            <option value="viewers-low">Viewers: Low to High</option>
            <option value="recent">Recently Detected</option>
            <option value="oldest">Oldest Detected</option>
            <option value="watchers">Most Watchers</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showMasjidsOnly"
            checked={showMasjidsOnly}
            onChange={(e) =>
              updateUrlParams({
                masjids: e.target.checked ? 'true' : 'false'
              })
            }
            className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="showMasjidsOnly" className="text-sm font-medium">
            Show masjids only
          </label>
        </div>
      </div>

      {/* Infected Sites Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {infectedSitesQuery.isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : infectedSitesQuery.error ? (
          <div className="p-8 text-center text-red-500">
            Failed to load infected sites data
          </div>
        ) : !infectedSitesQuery.data?.infectedSites.length ? (
          <div className="p-8 text-center text-gray-500">
            No infected sites found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Viewers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected Companies
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Detected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Watchers
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {infectedSitesQuery.data.infectedSites.map((site) => (
                  <React.Fragment key={site.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRowExpanded(site.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedRows.has(site.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <Link
                            href={`/${site.hostname}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {site.hostname}
                          </Link>
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {site.isMasjid ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Masjid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Other
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <span className={site.recentActivity > 10 ? 'font-semibold text-red-600' : ''}>
                          {site.recentActivity}
                        </span>
                        {site.activityTrend === 'increasing' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {site.activityTrend === 'decreasing' && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <span className={site.postsCount > 5 ? 'font-semibold text-green-600' : ''}>
                          {site.postsCount}
                        </span>
                        {site.postsTrend === 'increasing' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {site.postsTrend === 'decreasing' && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <span className={site.totalViews > 100 ? 'font-semibold text-blue-600' : ''}>
                          {site.totalViews}
                        </span>
                        {site.viewsTrend === 'increasing' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {site.viewsTrend === 'decreasing' && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <span className={site.uniqueViews > 50 ? 'font-semibold text-purple-600' : ''}>
                          {site.uniqueViews}
                        </span>
                        {site.viewersTrend === 'increasing' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {site.viewersTrend === 'decreasing' && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {site.detectedCompanies.map((company) => (
                          <span
                            key={company}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(site.firstDetected).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        {site.watcherCount > 0 ? (
                          <span className="font-medium">{site.watcherCount}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                        {site.watchersTrend === 'increasing' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {site.watchersTrend === 'decreasing' && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    </tr>
                    {expandedRows.has(site.id) && (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Watchers ({site.watcherCount})</h4>
                              {site.watcherEmails.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {site.watcherEmails.map((email) => (
                                    <Link
                                      key={email}
                                      href={`/mods/users?search=${encodeURIComponent(email)}`}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                    >
                                      {email}
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No watchers</p>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Active Known Users</h4>
                              {site.activeUserEmails.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {site.activeUserEmails.map((email) => (
                                    <Link
                                      key={email}
                                      href={`/mods/users?search=${encodeURIComponent(email)}`}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                                    >
                                      {email}
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No known users have interacted with this site</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert for high activity sites */}
      {infectedSitesQuery.data &&
        infectedSitesQuery.data.infectedSites.some(
          (site) => site.recentActivity > 20
        ) && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  High Activity Alert
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Some sites are showing unusually high activity. Consider
                  investigating these sites for potential issues.
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function getInfectedSitesQuerySignature(params: {
  showMasjidsOnly: boolean;
  sortBy: string;
  timeRange: string;
}) {
  return {
    queryKey: ['mods', 'infected-sites', params],
    queryFn: async function fetchInfectedSites() {
      const response = await axios.get<TGetInfectedSitesResponseData>(
        '/api/v1/mods/infected-sites',
        {
          params
        }
      );
      return response.data;
    }
  };
}

function useInfectedSitesQuery(params: {
  showMasjidsOnly: boolean;
  sortBy: string;
  timeRange: string;
}) {
  return useQuery(getInfectedSitesQuerySignature(params));
}

export default InfectedSitesPage;