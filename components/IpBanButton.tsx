import BanInteractionsTable from '@/components/BanInteractionsTable';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import { useToasts } from '@/hooks/useToasts';
import type { TBanIpRequestBody } from '@/pages/api/v1/mods/ips/[ipId]/ban';
import type { TUnbanIpRequestBody } from '@/pages/api/v1/mods/ips/[ipId]/unban';
import type { TBanInteraction } from '@/types/ban-interaction';
import type { TIp } from '@/types/ip';
import { getBanDashboardQuerySignature } from '@/utils/query-signatures';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

// Using type instead of interface per user preference
type IpBanButtonProps = {
  ip: Partial<TIp> & Pick<TIp, 'id' | 'isBanned' | 'value'>;
  onSuccess?: () => void;
};

function IpBanButton({ ip, onSuccess }: IpBanButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [shouldUnban, setShouldUnban] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const banHistoryQuery = useIpBanHistoryQuery(ip.id, isModalOpen);
  const banMutation = useBanIpMutation();
  const unbanMutation = useUnbanIpMutation();

  function openModal() {
    setIsModalOpen(true);
    setBanReason('');
    setShouldUnban(ip.isBanned);
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
        { ipId: ip.id, reason: banReason },
        {
          onSuccess: () => {
            closeModal();
            onSuccess?.();
          },
          onSettled: () => setIsProcessing(false)
        }
      );
    } else {
      // Ban IP
      banMutation.mutate(
        {
          ipId: ip.id,
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
        label={ip.isBanned ? 'Manage Ban' : 'Ban'}
        size="sm"
        outlined
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {ip.isBanned ? 'Change Ban Status' : 'Ban IP'}
            </h2>

            {/* IP Details */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">IP Details</h3>
              <p className="text-sm text-gray-600">ID: {ip.id}</p>
              <p className="text-sm text-gray-600">Address: {ip.value}</p>
              {ip.city && (
                <p className="text-sm text-gray-600">City: {ip.city}</p>
              )}
              {ip.country && (
                <p className="text-sm text-gray-600">Country: {ip.country}</p>
              )}
              <p className="text-sm text-gray-600">
                Status:{' '}
                <span
                  className={`font-medium ${
                    ip.isBanned ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {ip.isBanned ? 'Banned' : 'Active'}
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

            {/* Action Selection for banned IPs */}
            {ip.isBanned && (
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shouldUnban}
                    onChange={(e) => setShouldUnban(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Unban this IP</span>
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
                label={shouldUnban ? 'Unban IP' : 'Ban IP'}
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

// Query for IP ban history
function useIpBanHistoryQuery(ipId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['ips', ipId, 'banHistory'],
    queryFn: async () => {
      const response = await axios.get<{ interactions: TBanInteraction[] }>(
        `/api/v1/ips/${ipId}/ban-history`
      );
      return response.data.interactions;
    },
    enabled
  });
}

// Mutations
function useBanIpMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useToasts();

  return useMutation({
    mutationFn: async ({ ipId, reason }: { ipId: number; reason: string }) => {
      const response = await axios.post<{ success: true }>(
        `/api/v1/mods/ips/${ipId}/ban`,
        { reason } satisfies TBanIpRequestBody
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mods', 'ips'] });
      queryClient.invalidateQueries({ queryKey: ['ips'] });
      queryClient.invalidateQueries({
        queryKey: getBanDashboardQuerySignature().queryKey
      });
      addToast({
        type: 'success',
        message: 'IP banned successfully'
      });
    },
    onError: (error) => {
      console.error('Failed to ban IP:', error);
      addToast({
        type: 'error',
        message: 'Failed to ban IP'
      });
    }
  });
}

function useUnbanIpMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useToasts();

  return useMutation({
    mutationFn: async ({ ipId, reason }: { ipId: number; reason: string }) => {
      const response = await axios.post<{ success: true }>(
        `/api/v1/mods/ips/${ipId}/unban`,
        { reason } satisfies TUnbanIpRequestBody
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mods', 'ips'] });
      queryClient.invalidateQueries({ queryKey: ['ips'] });
      queryClient.invalidateQueries({
        queryKey: getBanDashboardQuerySignature().queryKey
      });
      addToast({
        type: 'success',
        message: 'IP unbanned successfully'
      });
    },
    onError: (error) => {
      console.error('Failed to unban IP:', error);
      addToast({
        type: 'error',
        message: 'Failed to unban IP'
      });
    }
  });
}

export default IpBanButton;
