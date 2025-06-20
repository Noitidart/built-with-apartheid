import { getCurrentUserId } from '@/utils/user-utils';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import WatchDialog from './WatchDialog';

interface User {
  id: string;
  email: string;
}

interface WatchSiteSectionProps {
  websiteId: number;
  hostname: string;
}

export default function WatchSiteSection({
  websiteId,
  hostname
}: WatchSiteSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const checkWatchStatus = async (userId: string) => {
    const watchResponse = await fetch(
      `/api/v1/users/${userId}/watching/${websiteId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (watchResponse.ok) {
      const watchData = (await watchResponse.json()) as { isWatching: boolean };
      setIsWatching(watchData.isWatching);
    }
  };

  const handleWatchDialog = async () => {
    const userId = getCurrentUserId();
    if (userId) {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = (await response.json()) as User;
        setUser(userData);
        await checkWatchStatus(userId);
      } else {
        setUser(null);
        setIsWatching(false);
      }
    }

    setIsDialogOpen(true);
  };

  const handleWatchStatusChange = (newWatchStatus: boolean) => {
    setIsWatching(newWatchStatus);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="text-center sm:text-left">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Interested in monitoring this site?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Receive email notifications about security changes and Israeli tech
          detection.
        </p>
      </div>
      <button
        onClick={handleWatchDialog}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
      >
        <Bell className="w-4 h-4" />
        {isWatching ? 'Stop Watching' : 'Start Watching'}
      </button>

      {isDialogOpen && (
        <WatchDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          site={hostname}
          siteId={websiteId}
          currentEmail={user?.email || ''}
          isCurrentlyWatching={isWatching}
          onWatchStatusChange={handleWatchStatusChange}
        />
      )}
    </div>
  );
}
