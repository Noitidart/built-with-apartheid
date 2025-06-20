import BanInteractionsTable from '@/components/BanInteractionsTable';
import LoginProtectedLayout from '@/components/LoginProtectedLayout';
import Spinner from '@/components/Spinner';
import { getLoginLayoutServerSideProps } from '@/lib/login-layout.backend';
import type { TMe } from '@/types/user';
import { getBanDashboardQuerySignature } from '@/utils/query-signatures';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export const getServerSideProps = getLoginLayoutServerSideProps;

type TBansDashboardPageProps = Awaited<
  ReturnType<typeof getServerSideProps>
>['props'];

function BansDashboardPage(_props: TBansDashboardPageProps) {
  return (
    <LoginProtectedLayout
      title="Ban Management"
      subtitle="Moderator Dashboard"
      subtitleHref="/mods"
      ContentComponent={BansDashboardContent}
    />
  );
}

type TBansDashboardContentProps = {
  me: TMe;
};

function BansDashboardContent(_props: TBansDashboardContentProps) {
  const dashboardquery = useBanDashboardQuery();

  if (dashboardquery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (dashboardquery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Banned Users</h3>
          <p className="text-2xl font-semibold mt-2">
            {dashboardquery.data?.stats.totalBannedUsers || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">
            Total Banned IPs
          </h3>
          <p className="text-2xl font-semibold mt-2">
            {dashboardquery.data?.stats.totalBannedIps || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Soft Banned IPs</h3>
          <p className="text-2xl font-semibold mt-2 text-yellow-600">
            {dashboardquery.data?.stats.softBannedIps || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Hard Banned IPs</h3>
          <p className="text-2xl font-semibold mt-2 text-red-600">
            {dashboardquery.data?.stats.hardBannedIps || 0}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/mods/users?banned=true"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Banned Users</h2>
          <p className="text-gray-600">View and manage banned users</p>
        </Link>
        <Link
          href="/mods/bans/ips"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Banned IPs</h2>
          <p className="text-gray-600">View and manage banned IPs</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Recent Ban Activity</h2>
        </div>
        <div className="p-6">
          <BanInteractionsTable
            interactions={dashboardquery.data?.recentBanInteractions || []}
          />
        </div>
      </div>
    </div>
  );
}

function useBanDashboardQuery() {
  return useQuery(getBanDashboardQuerySignature());
}

export default BansDashboardPage;
