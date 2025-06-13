import type { TMe } from '@/types/user';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export function getMeQuerySignature() {
  return {
    queryKey: ['me'],
    queryFn: async function fetchMe(): Promise<TMe | null> {
      return null;
    }
  } satisfies UseQueryOptions;
}

export function useMeQuery() {
  const query = useQuery({
    ...getMeQuerySignature(),
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
    notifyOnChangeProps: ['data']
  });

  return query;
}

export function useMe() {
  const meQuery = useMeQuery();

  return meQuery.data;
}
