import type { TMe } from '@/types/user';
import {
  QueryClient,
  type MutationCacheNotifyEvent,
  type QueryCacheNotifyEvent
} from '@tanstack/react-query';
import { useState } from 'react';
import { getMeQuerySignature } from './useMeQuery';

type TInitialPageProps = {
  me?: TMe;
};

function initializeQueryClient(
  initialPageProps?: TInitialPageProps
): QueryClient {
  const queryClient = new QueryClient();

  function updateMeQueryDataOnQueryUpdate(
    event: QueryCacheNotifyEvent | MutationCacheNotifyEvent
  ) {
    // console.log('event', event);

    if (event.type === 'updated') {
      // Continue
    } else {
      return;
    }

    const data =
      'query' in event ? event.query.state.data : event.mutation.state.data;

    // console.log('event', event);

    // Check if response contains 'me' property
    if (data && typeof data === 'object' && 'me' in data) {
      const me = data.me as TMe | null;

      // Update me query data using the same query key source of truth
      queryClient.setQueryData(getMeQuerySignature().queryKey, me);
    }
  }

  queryClient.getQueryCache().subscribe(updateMeQueryDataOnQueryUpdate);

  queryClient.getMutationCache().subscribe(updateMeQueryDataOnQueryUpdate);

  // Hydrate initial data if available. Do this before after updateMeQueryDataOnQueryCacheUpdate listener, so it triggers the side effects of setting the token in storage.
  if (initialPageProps?.me) {
    queryClient.setQueryData(
      getMeQuerySignature().queryKey,
      initialPageProps.me
    );
  }

  return queryClient;
}

export function useAppQueryClient(
  initialPageProps?: TInitialPageProps
): QueryClient {
  const [queryClient] = useState(() => initializeQueryClient(initialPageProps));
  return queryClient;
}
