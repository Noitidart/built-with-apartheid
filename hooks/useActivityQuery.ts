import type { TActivityResponseData } from '@/pages/api/v1/activity';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useActivityQuery() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async function fetchActivity() {
      const response = await axios.get<TActivityResponseData>(
        '/api/v1/activity'
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
