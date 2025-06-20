import BanButton from '@/components/BanButton';
import Button from '@/components/Button';
import LoginProtectedLayout from '@/components/LoginProtectedLayout';
import Pagination from '@/components/Pagination';
import Spinner from '@/components/Spinner';
import { getLoginLayoutServerSideProps } from '@/lib/login-layout.backend';
import type { TGetUsersResponseData } from '@/pages/api/v1/users';
import type { TMe } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export const getServerSideProps = getLoginLayoutServerSideProps;

type TUsersPageProps = Awaited<ReturnType<typeof getServerSideProps>>['props'];

function UsersPage(_props: TUsersPageProps) {
  return (
    <LoginProtectedLayout
      title="User Management"
      subtitle="Moderator Dashboard"
      subtitleHref="/mods"
      ContentComponent={UsersContent}
    />
  );
}

type TUsersContentProps = {
  me: TMe;
};

function UsersContent(_props: TUsersContentProps) {
  const router = useRouter();
  const isBannedFilter = router.query.banned === 'true';

  // Get pagination params from router query
  const currentPage = parseInt(router.query.page as string) || 1;
  const currentLimit = parseInt(router.query.limit as string) || 25;
  const currentSearch = (router.query.search as string) || '';

  const [search, setSearch] = useState(currentSearch);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [menuOpenUserId, setMenuOpenUserId] = useState<string | null>(null);
  const banButtonRefs = React.useRef<{
    [key: string]: HTMLButtonElement | null;
  }>({});

  // Update search state when router query changes
  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  const usersQuery = useUsersQuery({
    search: currentSearch,
    page: currentPage,
    limit: currentLimit,
    banned: isBannedFilter
  });

  function updateUrlParams(updates: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const newQuery = { ...router.query };

    if (updates.page !== undefined) {
      if (updates.page === 1) {
        delete newQuery.page;
      } else {
        newQuery.page = updates.page.toString();
      }
    }

    if (updates.limit !== undefined) {
      if (updates.limit === 25) {
        delete newQuery.limit;
      } else {
        newQuery.limit = updates.limit.toString();
      }
    }

    if (updates.search !== undefined) {
      if (updates.search === '') {
        delete newQuery.search;
      } else {
        newQuery.search = updates.search;
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

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateUrlParams({ search, page: 1 });
  }

  function handlePageChange(page: number) {
    updateUrlParams({ page });
  }

  function handlePageSizeChange(limit: number) {
    updateUrlParams({ limit, page: 1 });
  }

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuOpenUserId &&
        !(event.target as HTMLElement).closest('[data-menu-container]')
      ) {
        setMenuOpenUserId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenUserId]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      {isBannedFilter && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Banned Users</h1>
          <p className="text-gray-600">Showing only banned users</p>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or user ID..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <Button type="submit" label="Search" size="md" />
        </div>
      </form>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow ">
        {usersQuery.isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : usersQuery.error ? (
          <div className="p-8 text-center text-red-500">
            Failed to load banned users
          </div>
        ) : !usersQuery.data?.users.length ? (
          <div className="p-8 text-center text-gray-500">
            {isBannedFilter ? 'No banned users found' : 'No users found'}
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {usersQuery.data.users.map(
                  (user: TGetUsersResponseData['users'][0]) => (
                    <div key={user.id}>
                      <div className="px-4 py-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {user.email || 'No email'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.id}
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              {user.ips.length} IP
                              {user.ips.length !== 1 ? 's' : ''} •
                              {user.isBanned ? (
                                <span className="text-red-600">Banned</span>
                              ) : (
                                <span>
                                  {isBannedFilter ? 'Banned' : 'Created'}{' '}
                                  {new Date(
                                    user.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="relative" data-menu-container>
                            <button
                              onClick={() =>
                                setMenuOpenUserId(
                                  menuOpenUserId === user.id ? null : user.id
                                )
                              }
                              className="p-2 rounded-full hover:bg-gray-100"
                            >
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {menuOpenUserId === user.id && (
                              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setMenuOpenUserId(null);
                                      banButtonRefs.current[user.id]?.click();
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    {user.isBanned ? 'Manage Ban' : 'Ban User'}
                                  </button>
                                  {user.ips.length > 0 && (
                                    <button
                                      onClick={() => {
                                        setMenuOpenUserId(null);
                                        setExpandedUserId(
                                          expandedUserId === user.id
                                            ? null
                                            : user.id
                                        );
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      {expandedUserId === user.id
                                        ? 'Hide'
                                        : 'View'}{' '}
                                      IPs
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {expandedUserId === user.id && user.ips.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 border-t">
                          <h4 className="font-medium mb-2 text-sm">
                            Associated IPs:
                          </h4>
                          <ul className="space-y-1">
                            {user.ips.map(
                              (
                                ip: TGetUsersResponseData['users'][0]['ips'][0]
                              ) => (
                                <li key={ip.id} className="text-sm">
                                  {ip.value} -
                                  <span
                                    className={`ml-2 font-medium ${
                                      ip.isBanned
                                        ? 'text-red-600'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {ip.isBanned ? 'Banned' : 'Not banned'}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                      {/* Hidden BanButton for triggering */}
                      <div className="hidden">
                        <BanButton
                          user={user}
                          onSuccess={() => usersQuery.refetch()}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IPs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isBannedFilter ? 'Banned Since' : 'Created'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersQuery.data.users.map(
                    (user: TGetUsersResponseData['users'][0]) => (
                      <>
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.email || 'No email'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              {user.ips.length} IP
                              {user.ips.length !== 1 ? 's' : ''}
                              {user.ips.length > 0 && (
                                <button
                                  onClick={() =>
                                    setExpandedUserId(
                                      expandedUserId === user.id
                                        ? null
                                        : user.id
                                    )
                                  }
                                  className="ml-2 text-blue-600 hover:underline"
                                >
                                  {expandedUserId === user.id ? 'Hide' : 'Show'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.isBanned ? (
                              <span className="text-red-600">Banned</span>
                            ) : (
                              new Date(user.createdAt).toLocaleDateString()
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <BanButton
                              user={user}
                              onSuccess={() => usersQuery.refetch()}
                            />
                          </td>
                        </tr>
                        {expandedUserId === user.id && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 bg-gray-50">
                              {user.ips.length > 0 ? (
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Associated IPs:
                                  </h4>
                                  <ul className="space-y-1">
                                    {user.ips.map(
                                      (
                                        ip: TGetUsersResponseData['users'][0]['ips'][0]
                                      ) => (
                                        <li key={ip.id} className="text-sm">
                                          {ip.value} -
                                          <span
                                            className={`ml-2 font-medium ${
                                              ip.isBanned
                                                ? 'text-red-600'
                                                : 'text-gray-600'
                                            }`}
                                          >
                                            {ip.isBanned
                                              ? 'Banned'
                                              : 'Not banned'}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No associated IPs
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}

            <div className="border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(usersQuery.data.total / currentLimit)}
                totalItems={usersQuery.data.total}
                itemsPerPage={currentLimit}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[25, 100, 1000]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getUsersQuerySignature(params: {
  search?: string;
  page: number;
  limit: number;
  banned?: boolean;
}) {
  return {
    queryKey: ['mods', 'users', params],
    queryFn: async function fetchUsers() {
      const response = await axios.get<TGetUsersResponseData>('/api/v1/users', {
        params
      });
      return response.data;
    }
  };
}

function useUsersQuery(params: {
  search?: string;
  page: number;
  limit: number;
  banned?: boolean;
}) {
  return useQuery(getUsersQuerySignature(params));
}

export default UsersPage;
