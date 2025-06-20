import BanInteractionsTable from '@/components/BanInteractionsTable';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import { useToasts } from '@/hooks/useToasts';
import type { TBanUserRequestBody } from '@/pages/api/v1/mods/users/[userId]/ban';
import type { TUnbanUserRequestBody } from '@/pages/api/v1/mods/users/[userId]/unban';
import type { TBanInteraction } from '@/types/ban-interaction';
import type { TUser } from '@/types/user';
import { getBanDashboardQuerySignature } from '@/utils/query-signatures';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

// Using type instead of interface per user preference
type BanButtonProps = {
  user: Partial<TUser> & Pick<TUser, 'id' | 'isBanned'>;
  onSuccess?: () => void;
};

function BanButton({ user, onSuccess }: BanButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [shouldUnban, setShouldUnban] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const banHistoryQuery = useBanHistoryQuery(user.id, isModalOpen);
  const banMutation = useBanUserMutation();
  const unbanMutation = useUnbanUserMutation();

  function openModal() {
    setIsModalOpen(true);
    setBanReason('');
    setShouldUnban(user.isBanned);
  }

  function closeModal() {
    setIsModalOpen(false);
    setBanReason('');
    setShouldUnban(false);
  }

  function handleAction() {
    if (!banReason.trim()) {
      alert('Please provide a reason');
      return;
    }

    setIsProcessing(true);

    if (shouldUnban) {
      // Unban
      unbanMutation.mutate(
        { userId: user.id, reason: banReason },
        {
          onSuccess: () => {
            closeModal();
            onSuccess?.();
          },
          onSettled: () => setIsProcessing(false)
        }
      );
    } else {
      // Ban user
      banMutation.mutate(
        {
          userId: user.id,
          reason: banReason
        },
        {
          onSuccess: () => {
            closeModal();
            onSuccess?.();
          },
          onSettled: () => setIsProcessing(false)
        }
      );
    }
  }

  return (
    <>
      <Button
        onClick={openModal}
        label={user.isBanned ? 'Manage Ban' : 'Ban'}
        size="sm"
        outlined
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {user.isBanned ? 'Change Ban Status' : 'Ban User'}
            </h2>

            {/* User Details */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">User Details</h3>
              <p className="text-sm text-gray-600">ID: {user.id}</p>
              {user.email && (
                <p className="text-sm text-gray-600">Email: {user.email}</p>
              )}
              <p className="text-sm text-gray-600">
                Status:{' '}
                <span
                  className={`font-medium ${
                    user.isBanned ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {user.isBanned ? 'Banned' : 'Active'}
                </span>
              </p>
            </div>

            {/* Ban History */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Ban History</h3>
              {banHistoryQuery.isLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : banHistoryQuery.error ? (
                <p className="text-sm text-red-500">
                  Failed to load ban history
                </p>
              ) : (
                <BanInteractionsTable
                  interactions={banHistoryQuery.data || []}
                  compact
                />
              )}
            </div>

            {/* Action Selection for banned users */}
            {user.isBanned && (
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shouldUnban}
                    onChange={(e) => setShouldUnban(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Unban this user</span>
                </label>
              </div>
            )}

            {/* Reason Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for this action..."
                className="w-full px-3 py-2 border rounded-lg resize-none"
                rows={3}
                disabled={isProcessing}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                onClick={closeModal}
                label="Cancel"
                size="sm"
                outlined
                disabled={isProcessing}
              />
              <Button
                onClick={handleAction}
                label={shouldUnban ? 'Unban User' : 'Ban User'}
                size="sm"
                loading={isProcessing}
                disabled={isProcessing || !banReason.trim()}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Query for ban history
function useBanHistoryQuery(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['users', userId, 'banHistory'],
    queryFn: async () => {
      const response = await axios.get<{ interactions: TBanInteraction[] }>(
        `/api/v1/users/${userId}/ban-history`
      );
      return response.data.interactions;
    },
    enabled
  });
}

// Mutations
function useBanUserMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useToasts();

  return useMutation({
    mutationFn: async ({
      userId,
      reason
    }: {
      userId: string;
      reason: string;
    }) => {
      const response = await axios.post<{ success: true }>(
        `/api/v1/mods/users/${userId}/ban`,
        { reason } satisfies TBanUserRequestBody
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mods', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({
        queryKey: getBanDashboardQuerySignature().queryKey
      });
      addToast({
        type: 'success',
        message: 'User banned successfully'
      });
    },
    onError: (error) => {
      console.error('Failed to ban user:', error);
      addToast({
        type: 'error',
        message: 'Failed to ban user'
      });
    }
  });
}

function useUnbanUserMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useToasts();

  return useMutation({
    mutationFn: async ({
      userId,
      reason
    }: {
      userId: string;
      reason: string;
    }) => {
      const response = await axios.post<{ success: true }>(
        `/api/v1/mods/users/${userId}/unban`,
        { reason } satisfies TUnbanUserRequestBody
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mods', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({
        queryKey: getBanDashboardQuerySignature().queryKey
      });
      addToast({
        type: 'success',
        message: 'User unbanned successfully'
      });
    },
    onError: (error) => {
      console.error('Failed to unban user:', error);
      addToast({
        type: 'error',
        message: 'Failed to unban user'
      });
    }
  });
}

export default BanButton;
