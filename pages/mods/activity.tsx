import LoginProtectedLayout from '@/components/LoginProtectedLayout';
import Spinner from '@/components/Spinner';
import { getLoginLayoutServerSideProps } from '@/lib/login-layout.backend';
import type { TGetActivityMonitorResponseData } from '@/pages/api/v1/mods/activity';
import type { TMe } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

export const getServerSideProps = getLoginLayoutServerSideProps;

type TActivityPageProps = Awaited<
  ReturnType<typeof getServerSideProps>
>['props'];

function ActivityPage(_props: TActivityPageProps) {
  return (
    <LoginProtectedLayout
      title="Activity Monitor"
      subtitle="Moderator Dashboard"
      subtitleHref="/mods"
      ContentComponent={ActivityContent}
    />
  );
}

type TActivityContentProps = {
  me: TMe;
};

function ActivityContent(_props: TActivityContentProps) {
  const router = useRouter();
  const timeRange = (router.query.range as string) || '24h';
  const interactionType = (router.query.type as string) || 'all';
  const viewMode = (router.query.view as string) || 'timeline';

  const [expandedInteractionId, setExpandedInteractionId] = useState<
    number | null
  >(null);
  const [expandedIp, setExpandedIp] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const activityQuery = useActivityQuery({
    timeRange,
    interactionType
  });

  function updateUrlParams(updates: {
    range?: string;
    type?: string;
    view?: string;
  }) {
    const newQuery = { ...router.query };

    if (updates.range !== undefined) {
      if (updates.range === '24h') {
        delete newQuery.range;
      } else {
        newQuery.range = updates.range;
      }
    }

    if (updates.type !== undefined) {
      if (updates.type === 'all') {
        delete newQuery.type;
      } else {
        newQuery.type = updates.type;
      }
    }

    if (updates.view !== undefined) {
      if (updates.view === 'timeline') {
        delete newQuery.view;
      } else {
        newQuery.view = updates.view;
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

  function handleTimeRangeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateUrlParams({ range: e.target.value });
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateUrlParams({ type: e.target.value });
  }

  return (
    <div className="container mx-auto">
      {activityQuery.data && (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div>
              <label
                htmlFor="timeRange"
                className="block text-sm font-medium mb-1"
              >
                Time Range
              </label>
              <select
                id="timeRange"
                value={timeRange}
                onChange={handleTimeRangeChange}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                Activity Type
              </label>
              <select
                id="type"
                value={interactionType}
                onChange={handleTypeChange}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Activities</option>
                <option value="SCAN">Scans</option>
                <option value="POST">Posts</option>
                <option value="MILESTONE">Milestones</option>
                <option value="MOD_ADDED">Mod Added</option>
                <option value="MOD_REMOVED">Mod Removed</option>
                <option value="BANNED_USER">User Bans</option>
                <option value="UNBANNED_USER">User Unbans</option>
                <option value="BANNED_IPS">IP Bans</option>
                <option value="UNBANNED_IPS">IP Unbans</option>
              </select>
            </div>
          </div>

          {/* Stats Overview */}
          {activityQuery.data && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Activities
                </h3>
                <p className="text-2xl font-bold">
                  {activityQuery.data.stats.totalInteractions}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Active Users
                </h3>
                <p className="text-2xl font-bold">
                  {activityQuery.data.stats.activeUsers}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Active IPs
                </h3>
                <p className="text-2xl font-bold">
                  {activityQuery.data.stats.activeIps}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Suspicious Activities
                </h3>
                <p className="text-2xl font-bold text-red-600">
                  {activityQuery.data.stats.suspiciousActivities}
                </p>
              </div>
            </div>
          )}

          {/* Suspicious Activity Alerts */}
          {activityQuery.data &&
            activityQuery.data.suspiciousActivities.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  ⚠️ Suspicious Activity Detected
                </h3>
                <ul className="space-y-2">
                  {activityQuery.data.suspiciousActivities.map((activity) => (
                    <li key={activity.id} className="text-sm text-red-700">
                      <strong>{activity.type}:</strong> {activity.description}
                      {activity.user && (
                        <Link
                          href={`/mods/users?search=${activity.user.id}`}
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          View User
                        </Link>
                      )}
                      {activity.ip && (
                        <Link
                          href={`/mods/ips?search=${activity.ip.value}`}
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          View IP
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* View Mode Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => updateUrlParams({ view: 'timeline' })}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'timeline'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => updateUrlParams({ view: 'ip-groups' })}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'ip-groups'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                IP Groups
              </button>
              <button
                onClick={() => updateUrlParams({ view: 'user-groups' })}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'user-groups'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Groups
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Content based on view mode */}
      {viewMode === 'timeline' && (
        <ActivityTimeline
          activityQuery={activityQuery}
          expandedInteractionId={expandedInteractionId}
          setExpandedInteractionId={setExpandedInteractionId}
        />
      )}

      {viewMode === 'ip-groups' && (
        <IpGroupsView
          activityQuery={activityQuery}
          expandedIp={expandedIp}
          setExpandedIp={setExpandedIp}
        />
      )}

      {viewMode === 'user-groups' && (
        <UserGroupsView
          activityQuery={activityQuery}
          expandedUser={expandedUser}
          setExpandedUser={setExpandedUser}
        />
      )}
    </div>
  );
}

function ActivityTimeline({
  activityQuery,
  expandedInteractionId,
  setExpandedInteractionId
}: {
  activityQuery: ReturnType<typeof useActivityQuery>;
  expandedInteractionId: number | null;
  setExpandedInteractionId: (id: number | null) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      {activityQuery.isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : activityQuery.error ? (
        <div className="p-8 text-center text-red-500">
          Failed to load activity data
        </div>
      ) : !activityQuery.data?.interactions.length ? (
        <div className="p-8 text-center text-gray-500">
          No activity found for the selected filters
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {activityQuery.data.interactions.map((interaction) => (
            <div key={interaction.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    setExpandedInteractionId(
                      expandedInteractionId === interaction.id
                        ? null
                        : interaction.id
                    )
                  }
                  className="mt-1"
                >
                  {expandedInteractionId === interaction.id ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInteractionTypeStyle(
                        interaction.type
                      )}`}
                    >
                      {interaction.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(interaction.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-1 text-sm">
                    {interaction.user && (
                      <Link
                        href={`/mods/users?search=${interaction.user.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {interaction.user.email ||
                          `User ${interaction.user.id}`}
                      </Link>
                    )}
                    {interaction.website && (
                      <span className="ml-2">
                        on{' '}
                        <Link
                          href={`/${interaction.website.hostname}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {interaction.website.hostname}
                        </Link>
                      </span>
                    )}
                    {interaction.ip && (
                      <span className="ml-2 text-gray-500">
                        from{' '}
                        <Link
                          href={`/mods/ips?search=${interaction.ip.value}`}
                          className="text-blue-600 hover:underline"
                        >
                          {interaction.ip.value}
                        </Link>
                        {interaction.ip.city && (
                          <span className="text-gray-400">
                            {' '}
                            ({interaction.ip.city}, {interaction.ip.country})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedInteractionId === interaction.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                      {interaction.type === 'SCAN' && interaction.scan && (
                        <div>
                          <h4 className="font-medium mb-1">Scan Details:</h4>
                          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                            {JSON.stringify(interaction.scan.changes, null, 2)}
                          </pre>
                        </div>
                      )}
                      {interaction.type === 'POST' && interaction.post && (
                        <div>
                          <h4 className="font-medium mb-1">Post Content:</h4>
                          <p className="text-gray-700">
                            {interaction.post.body}
                          </p>
                        </div>
                      )}
                      {interaction.type === 'MILESTONE' &&
                        interaction.milestone && (
                          <div>
                            <h4 className="font-medium mb-1">
                              Milestone Data:
                            </h4>
                            <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                              {JSON.stringify(
                                interaction.milestone.data,
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        )}
                      {(interaction.type === 'BANNED_USER' ||
                        interaction.type === 'UNBANNED_USER' ||
                        interaction.type === 'BANNED_IPS' ||
                        interaction.type === 'UNBANNED_IPS') &&
                        interaction.targetUsers.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-1">
                              Affected Users:
                            </h4>
                            <ul className="list-disc list-inside">
                              {interaction.targetUsers.map((user) => (
                                <li key={user.id}>
                                  <Link
                                    href={`/mods/users?search=${user.id}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {user.email || user.id}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {(interaction.type === 'BANNED_IPS' ||
                        interaction.type === 'UNBANNED_IPS') &&
                        interaction.targetIps.length > 0 && (
                          <div className="mt-2">
                            <h4 className="font-medium mb-1">Affected IPs:</h4>
                            <ul className="list-disc list-inside">
                              {interaction.targetIps.map((ip) => (
                                <li key={ip.id}>
                                  <Link
                                    href={`/mods/ips?search=${ip.value}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {ip.value}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IpGroupsView({
  activityQuery,
  expandedIp,
  setExpandedIp
}: {
  activityQuery: ReturnType<typeof useActivityQuery>;
  expandedIp: string | null;
  setExpandedIp: (ip: string | null) => void;
}) {
  if (activityQuery.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (activityQuery.error || !activityQuery.data) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-red-500">
          Failed to load activity data
        </div>
      </div>
    );
  }

  // Group interactions by IP
  const ipGroups = new Map<
    string,
    {
      ip: (typeof activityQuery.data.interactions)[0]['ip'];
      interactions: typeof activityQuery.data.interactions;
      uniqueUsers: Set<string>;
      activityTypes: Map<string, number>;
    }
  >();

  activityQuery.data.interactions.forEach((interaction) => {
    if (!interaction.ip) return;

    const ipValue = interaction.ip.value;
    if (!ipGroups.has(ipValue)) {
      ipGroups.set(ipValue, {
        ip: interaction.ip,
        interactions: [],
        uniqueUsers: new Set(),
        activityTypes: new Map()
      });
    }

    const group = ipGroups.get(ipValue)!;
    group.interactions.push(interaction);

    if (interaction.user) {
      group.uniqueUsers.add(interaction.user.id);
    }

    const typeCount = group.activityTypes.get(interaction.type) || 0;
    group.activityTypes.set(interaction.type, typeCount + 1);
  });

  // Convert to array and sort by activity count
  const sortedIpGroups = Array.from(ipGroups.entries())
    .map(([ipValue, group]) => ({
      ipValue,
      ...group,
      totalActivity: group.interactions.length,
      uniqueUserCount: group.uniqueUsers.size
    }))
    .sort((a, b) => b.totalActivity - a.totalActivity);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium">Activity by IP Address</h3>
        <p className="text-sm text-gray-500 mt-1">
          Click on an IP to see detailed activity
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {sortedIpGroups.map(
          ({
            ipValue,
            ip,
            totalActivity,
            uniqueUserCount,
            interactions,
            activityTypes
          }) => {
            const isSuspicious = uniqueUserCount > 3 || totalActivity > 50;
            const isExpanded = expandedIp === ipValue;

            return (
              <div key={ipValue} className="hover:bg-gray-50">
                <button
                  onClick={() => setExpandedIp(isExpanded ? null : ipValue)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ipValue}</span>
                          {ip?.city && (
                            <span className="text-sm text-gray-500">
                              ({ip.city}, {ip.country})
                            </span>
                          )}
                          {isSuspicious && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Suspicious
                            </span>
                          )}
                          {ip?.isBanned && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black text-white">
                              Banned
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {totalActivity} activities • {uniqueUserCount} unique
                          user{uniqueUserCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {Array.from(activityTypes.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([type, count]) => (
                          <span
                            key={type}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInteractionTypeStyle(
                              type
                            )}`}
                          >
                            {type} ({count})
                          </span>
                        ))}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-2">Activity Breakdown</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Array.from(activityTypes.entries())
                          .sort((a, b) => b[1] - a[1])
                          .map(([type, count]) => (
                            <div key={type} className="text-sm">
                              <span className="font-medium">{type}:</span>{' '}
                              {count}
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Activity</h4>
                      {interactions.slice(0, 10).map((interaction) => (
                        <div
                          key={interaction.id}
                          className="text-sm border-l-2 border-gray-200 pl-3"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInteractionTypeStyle(
                                interaction.type
                              )}`}
                            >
                              {interaction.type}
                            </span>
                            <span className="text-gray-500">
                              {new Date(interaction.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {interaction.user && (
                            <div className="text-gray-600 mt-1">
                              User:{' '}
                              <Link
                                href={`/mods/users?search=${interaction.user.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {interaction.user.email || interaction.user.id}
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                      {interactions.length > 10 && (
                        <Link
                          href={`/mods/activity?type=all&search=${ipValue}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View all {interactions.length} activities
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

function UserGroupsView({
  activityQuery,
  expandedUser,
  setExpandedUser
}: {
  activityQuery: ReturnType<typeof useActivityQuery>;
  expandedUser: string | null;
  setExpandedUser: (userId: string | null) => void;
}) {
  if (activityQuery.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (activityQuery.error || !activityQuery.data) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-red-500">
          Failed to load activity data
        </div>
      </div>
    );
  }

  // Group interactions by user
  const userGroups = new Map<
    string,
    {
      user: (typeof activityQuery.data.interactions)[0]['user'];
      interactions: typeof activityQuery.data.interactions;
      ips: Set<string>;
      activityTypes: Map<string, number>;
    }
  >();

  activityQuery.data.interactions.forEach((interaction) => {
    if (!interaction.user) return;

    const userId = interaction.user.id;
    if (!userGroups.has(userId)) {
      userGroups.set(userId, {
        user: interaction.user,
        interactions: [],
        ips: new Set(),
        activityTypes: new Map()
      });
    }

    const group = userGroups.get(userId)!;
    group.interactions.push(interaction);

    if (interaction.ip) {
      group.ips.add(interaction.ip.value);
    }

    const typeCount = group.activityTypes.get(interaction.type) || 0;
    group.activityTypes.set(interaction.type, typeCount + 1);
  });

  // Convert to array and sort by activity count
  const sortedUserGroups = Array.from(userGroups.entries())
    .map(([userId, group]) => {
      const firstActivity = group.interactions[group.interactions.length - 1];
      const lastActivity = group.interactions[0];
      const timeSpan =
        new Date(lastActivity.createdAt).getTime() -
        new Date(firstActivity.createdAt).getTime();
      const hoursActive = Math.max(timeSpan / (1000 * 60 * 60), 0.1);
      const activityRate = group.interactions.length / hoursActive;

      return {
        userId,
        ...group,
        totalActivity: group.interactions.length,
        ipCount: group.ips.size,
        activityRate,
        hoursActive
      };
    })
    .sort((a, b) => b.totalActivity - a.totalActivity);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium">Activity by User</h3>
        <p className="text-sm text-gray-500 mt-1">
          Click on a user to see detailed activity
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {sortedUserGroups.map(
          ({
            userId,
            user,
            totalActivity,
            ipCount,
            interactions,
            activityTypes,
            activityRate
          }) => {
            const isSuspicious = activityRate > 10 || ipCount > 3;
            const isExpanded = expandedUser === userId;

            return (
              <div key={userId} className="hover:bg-gray-50">
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : userId)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user?.email || `User ${userId}`}
                          </span>
                          {isSuspicious && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Suspicious
                            </span>
                          )}
                          {user?.isBanned && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black text-white">
                              Banned
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {totalActivity} activities • {ipCount} IP
                          {ipCount !== 1 ? 's' : ''} • {activityRate.toFixed(1)}{' '}
                          activities/hour
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {Array.from(activityTypes.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([type, count]) => (
                          <span
                            key={type}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInteractionTypeStyle(
                              type
                            )}`}
                          >
                            {type} ({count})
                          </span>
                        ))}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-2">User Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">
                            Total Activities:
                          </span>{' '}
                          {totalActivity}
                        </div>
                        <div>
                          <span className="text-gray-500">Activity Rate:</span>{' '}
                          {activityRate.toFixed(1)}/hour
                        </div>
                        <div>
                          <span className="text-gray-500">IPs Used:</span>{' '}
                          {ipCount}
                        </div>
                        <div>
                          <span className="text-gray-500">User ID:</span>{' '}
                          {userId}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Activity</h4>
                      {interactions.slice(0, 10).map((interaction) => (
                        <div
                          key={interaction.id}
                          className="text-sm border-l-2 border-gray-200 pl-3"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInteractionTypeStyle(
                                interaction.type
                              )}`}
                            >
                              {interaction.type}
                            </span>
                            <span className="text-gray-500">
                              {new Date(interaction.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {interaction.ip && (
                            <div className="text-gray-600 mt-1">
                              From:{' '}
                              <Link
                                href={`/mods/ips?search=${interaction.ip.value}`}
                                className="text-blue-600 hover:underline"
                              >
                                {interaction.ip.value}
                              </Link>
                              {interaction.ip.city && (
                                <span className="text-gray-400">
                                  {' '}
                                  ({interaction.ip.city},{' '}
                                  {interaction.ip.country})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {interactions.length > 10 && (
                        <Link
                          href={`/mods/users?search=${userId}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View all {interactions.length} activities
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

function getInteractionTypeStyle(type: string) {
  switch (type) {
    case 'SCAN':
      return 'bg-blue-100 text-blue-800';
    case 'POST':
      return 'bg-green-100 text-green-800';
    case 'MILESTONE':
      return 'bg-purple-100 text-purple-800';
    case 'MOD_ADDED':
    case 'MOD_REMOVED':
      return 'bg-yellow-100 text-yellow-800';
    case 'BANNED_USER':
    case 'BANNED_IPS':
      return 'bg-red-100 text-red-800';
    case 'UNBANNED_USER':
    case 'UNBANNED_IPS':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getActivityQuerySignature(params: {
  timeRange: string;
  interactionType: string;
}) {
  return {
    queryKey: ['mods', 'activity', params],
    queryFn: async function fetchActivity() {
      const response = await axios.get<TGetActivityMonitorResponseData>(
        '/api/v1/mods/activity',
        {
          params
        }
      );
      return response.data;
    }
  };
}

function useActivityQuery(params: {
  timeRange: string;
  interactionType: string;
}) {
  return useQuery(getActivityQuerySignature(params));
}

export default ActivityPage;
