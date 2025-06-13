import type { TRecentActivityResponseData } from '@/pages/api/v1/recent-activity';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

export function useActivityQuery() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async function fetchActivity() {
      const response = await axios.get<TRecentActivityResponseData>(
        '/api/v1/recent-activity'
      );

      return response.data;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000, // 30 seconds
    gcTime: 60000 // 1 minute
  });
}
