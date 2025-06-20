import Button from '@/components/Button';
import IpBanButton from '@/components/IpBanButton';
import LoginProtectedLayout from '@/components/LoginProtectedLayout';
import Pagination from '@/components/Pagination';
import Spinner from '@/components/Spinner';
import { getLoginLayoutServerSideProps } from '@/lib/login-layout.backend';
import type { TGetIpsResponseData } from '@/pages/api/v1/ips';
import type { TMe } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export const getServerSideProps = getLoginLayoutServerSideProps;

type TIpsPageProps = Awaited<ReturnType<typeof getServerSideProps>>['props'];

function IpsPage(_props: TIpsPageProps) {
  return (
    <LoginProtectedLayout
      title="IP Management"
      subtitle="Moderator Dashboard"
      subtitleHref="/mods"
      ContentComponent={IpsContent}
    />
  );
}

type TIpsContentProps = {
  me: TMe;
};

function IpsContent(_props: TIpsContentProps) {
  const router = useRouter();
  const isBannedFilter = router.query.banned === 'true';

  // Get pagination params from router query
  const currentPage = parseInt(router.query.page as string) || 1;
  const currentLimit = parseInt(router.query.limit as string) || 25;
  const currentSearch = (router.query.search as string) || '';

  const [search, setSearch] = useState(currentSearch);
  const [expandedIpId, setExpandedIpId] = useState<number | null>(null);
  const [menuOpenIpId, setMenuOpenIpId] = useState<number | null>(null);
  const banButtonRefs = React.useRef<{
    [key: number]: HTMLButtonElement | null;
  }>({});

  // Update search state when router query changes
  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  const ipsQuery = useIpsQuery({
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
        menuOpenIpId &&
        !(event.target as HTMLElement).closest('[data-menu-container]')
      ) {
        setMenuOpenIpId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenIpId]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      {isBannedFilter && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Banned IPs</h1>
          <p className="text-gray-600">Showing only banned IPs</p>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IP address, city, or country..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <Button type="submit" label="Search" size="md" />
        </div>
      </form>

      {/* IPs Table */}
      <div className="bg-white rounded-lg shadow ">
        {ipsQuery.isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : ipsQuery.error ? (
          <div className="p-8 text-center text-red-500">Failed to load IPs</div>
        ) : !ipsQuery.data?.ips.length ? (
          <div className="p-8 text-center text-gray-500">
            {isBannedFilter ? 'No banned IPs found' : 'No IPs found'}
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {ipsQuery.data.ips.map((ip: TGetIpsResponseData['ips'][0]) => (
                  <div key={ip.id}>
                    <div className="px-4 py-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {ip.value}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ip.city && ip.country
                              ? `${ip.city}, ${ip.country}`
                              : ip.country || 'Unknown location'}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {ip.users.length} User
                            {ip.users.length !== 1 ? 's' : ''} •
                            {ip.isBanned ? (
                              <span className="text-red-600">Banned</span>
                            ) : (
                              <span>
                                {isBannedFilter ? 'Banned' : 'Created'}{' '}
                                {new Date(ip.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="relative" data-menu-container>
                          <button
                            onClick={() =>
                              setMenuOpenIpId(
                                menuOpenIpId === ip.id ? null : ip.id
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
                          {menuOpenIpId === ip.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setMenuOpenIpId(null);
                                    banButtonRefs.current[ip.id]?.click();
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {ip.isBanned ? 'Manage Ban' : 'Ban IP'}
                                </button>
                                {ip.users.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setMenuOpenIpId(null);
                                      setExpandedIpId(
                                        expandedIpId === ip.id ? null : ip.id
                                      );
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    {expandedIpId === ip.id ? 'Hide' : 'View'}{' '}
                                    Users
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedIpId === ip.id && ip.users.length > 0 && (
                      <div className="px-4 py-3 bg-gray-50 border-t">
                        <h4 className="font-medium mb-2 text-sm">
                          Associated Users:
                        </h4>
                        <ul className="space-y-1">
                          {ip.users.map(
                            (
                              user: TGetIpsResponseData['ips'][0]['users'][0]
                            ) => (
                              <li key={user.id} className="text-sm">
                                {user.email || user.id} -
                                <span
                                  className={`ml-2 font-medium ${
                                    user.isBanned
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                                  }`}
                                >
                                  {user.isBanned ? 'Banned' : 'Not banned'}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    {/* Hidden IpBanButton for triggering */}
                    <div className="hidden">
                      <IpBanButton
                        ip={ip}
                        onSuccess={() => ipsQuery.refetch()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
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
                  {ipsQuery.data.ips.map(
                    (ip: TGetIpsResponseData['ips'][0]) => (
                      <>
                        <tr key={ip.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {ip.value}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {ip.id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {ip.city && ip.country
                                ? `${ip.city}, ${ip.country}`
                                : ip.country || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              {ip.users.length} User
                              {ip.users.length !== 1 ? 's' : ''}
                              {ip.users.length > 0 && (
                                <button
                                  onClick={() =>
                                    setExpandedIpId(
                                      expandedIpId === ip.id ? null : ip.id
                                    )
                                  }
                                  className="ml-2 text-blue-600 hover:underline"
                                >
                                  {expandedIpId === ip.id ? 'Hide' : 'Show'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ip.isBanned ? (
                              <span className="text-red-600">Banned</span>
                            ) : (
                              new Date(ip.createdAt).toLocaleDateString()
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <IpBanButton
                              ip={ip}
                              onSuccess={() => ipsQuery.refetch()}
                            />
                          </td>
                        </tr>
                        {expandedIpId === ip.id && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              {ip.users.length > 0 ? (
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Associated Users:
                                  </h4>
                                  <ul className="space-y-1">
                                    {ip.users.map(
                                      (
                                        user: TGetIpsResponseData['ips'][0]['users'][0]
                                      ) => (
                                        <li key={user.id} className="text-sm">
                                          {user.email || user.id} -
                                          <span
                                            className={`ml-2 font-medium ${
                                              user.isBanned
                                                ? 'text-red-600'
                                                : 'text-gray-600'
                                            }`}
                                          >
                                            {user.isBanned
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
                                  No associated users
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
                totalPages={Math.ceil(ipsQuery.data.total / currentLimit)}
                totalItems={ipsQuery.data.total}
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

function getIpsQuerySignature(params: {
  search?: string;
  page: number;
  limit: number;
  banned?: boolean;
}) {
  return {
    queryKey: ['mods', 'ips', params],
    queryFn: async function fetchIps() {
      const response = await axios.get<TGetIpsResponseData>('/api/v1/ips', {
        params
      });
      return response.data;
    }
  };
}

function useIpsQuery(params: {
  search?: string;
  page: number;
  limit: number;
  banned?: boolean;
}) {
  return useQuery(getIpsQuerySignature(params));
}

export default IpsPage;
