import type { TRecentActivityResponseData } from '@/pages/api/v1/recent-activity';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useActivityQuery() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async function fetchActivity() {
      const response = await axios.get<TRecentActivityResponseData>(
        '/api/v1/recent-activity'
      );
      console.log('recentActivityResponse.data', response.data);
      return response.data;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000, // 30 seconds
    gcTime: 60000 // 1 minute
  });
}
