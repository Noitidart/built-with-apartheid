import type { TTimelineResponseData } from '@/pages/api/v1/[websiteId]/timeline';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function getTimelineQuerySignature(websiteId: number) {
  return {
    queryKey: ['timeline', websiteId],
    queryFn: async function fetchTimeline() {
      const response = await axios.get<TTimelineResponseData>(
        `/api/v1/${websiteId}/timeline`
      );
      return response.data;
    }
  };
}

export function useTimelineQuery(websiteId: number) {
  const timelineQuery = getTimelineQuerySignature(websiteId);

  return useQuery({
    ...timelineQuery,
    enabled: !!websiteId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    notifyOnChangeProps: ['data', 'status', 'error', 'isFetching']
  });
}

export function useTimelineUserNumber(websiteId: number) {
  const queryClient = useQueryClient();
  const timelineQuerySignature = getTimelineQuerySignature(websiteId);
  const timelineData = queryClient.getQueryData<TTimelineResponseData>(
    timelineQuerySignature.queryKey
  );

  return timelineData?.meUserNumber ?? null;
}
