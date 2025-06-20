import LoginProtectedLayout, {
  LogoutButton
} from '@/components/LoginProtectedLayout';
import { getLoginLayoutServerSideProps } from '@/lib/login-layout.backend';
import type { TMe } from '@/types/user';
import Link from 'next/link';

export const getServerSideProps = getLoginLayoutServerSideProps;

type TModsPageProps = Awaited<ReturnType<typeof getServerSideProps>>['props'];

function ModsPage(_props: TModsPageProps) {
  return (
    <LoginProtectedLayout
      title="Moderator Dashboard"
      subtitle="Built with Apartheid"
      subtitleHref="/"
      ContentComponent={Dashboard}
    />
  );
}

type TDashboardProps = {
  me: TMe;
};

function Dashboard(props: TDashboardProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Welcome, {props.me.email}!</h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          As a moderator, you have access to manage the team and monitor
          activity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/mods/team"
            className="block p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
          >
            <h3 className="text-xl font-semibold mb-2">Manage Team</h3>

            <p className="text-gray-600 dark:text-gray-400">
              Add or remove moderators from the team
            </p>
          </Link>

          <Link
            href="/mods/users"
            className="block p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
          >
            <h3 className="text-xl font-semibold mb-2">Manage Users</h3>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all users
            </p>
          </Link>

          <Link
            href="/mods/bans"
            className="block p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
          >
            <h3 className="text-xl font-semibold mb-2">Manage Bans</h3>

            <p className="text-gray-600 dark:text-gray-400">
              View and manage user and IP bans
            </p>
          </Link>

          <Link
            href="/mods/activity"
            className="block p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition"
          >
            <h3 className="text-xl font-semibold mb-2">Activity Monitor</h3>

            <p className="text-gray-600 dark:text-gray-400">
              View recent user activity and identify bad actors
            </p>
          </Link>
        </div>
      </div>

      <div className="flex justify-center">
        <LogoutButton size="md" />
      </div>
    </div>
  );
}

export default ModsPage;
