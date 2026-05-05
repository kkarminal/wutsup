import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { loadConfig } from '@/services/config';
import {
  createDiscoveryApiClient,
  DiscoveryItem,
  DiscoveryPageResponse,
} from '@/services/discoveryApi';

export interface UseDiscoveryFeedResult {
  items: DiscoveryItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  fetchNextPage: () => void;
  retry: () => void;
}

/**
 * Resolves the API base URL in a way that works on both iOS and Android.
 * Mirrors the logic in useOrbController.
 */
function resolveApiBaseUrl(): string {
  const envUrl = loadConfig().apiBaseUrl;

  const hostUri = Constants.expoGoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000`;
  }

  if (Platform.OS === 'android') {
    return envUrl
      .replace('localhost', '10.0.2.2')
      .replace('127.0.0.1', '10.0.2.2');
  }

  return envUrl;
}

/**
 * Reactive hook that manages fetching, pagination, loading state, and error
 * state for the discovery results feed.
 *
 * - On `activeNodeId` change: aborts in-flight request, resets items/page, fetches page 1
 * - `fetchNextPage`: increments page, fetches next page, appends results
 * - `hasMore`: `items.length < totalCount`
 * - `retry`: re-attempts the last failed fetch
 */
export function useDiscoveryFeed(activeNodeId: number | null): UseDiscoveryFeedResult {
  const apiClientRef = useRef(createDiscoveryApiClient(resolveApiBaseUrl()));
  const abortControllerRef = useRef<AbortController | null>(null);

  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = items.length < totalCount;

  // Track the last failed fetch context for retry
  const lastFailedPageRef = useRef<number>(1);

  const fetchPage = useCallback(
    async (nodeId: number, pageNum: number, signal: AbortSignal) => {
      const response: DiscoveryPageResponse = await apiClientRef.current.getItems(
        nodeId,
        pageNum,
        20,
        signal,
      );
      return response;
    },
    [],
  );

  // Fetch page 1 whenever activeNodeId changes
  useEffect(() => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset state
    setItems([]);
    setPage(1);
    setTotalCount(0);
    setError(null);
    setLoadingMore(false);

    if (activeNodeId === null) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    fetchPage(activeNodeId, 1, controller.signal)
      .then((response) => {
        // Only apply if this controller hasn't been aborted
        if (!controller.signal.aborted) {
          setItems(response.items);
          setTotalCount(response.totalCount);
          setPage(1);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Request was cancelled, ignore
        }
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch items');
          setLoading(false);
          lastFailedPageRef.current = 1;
        }
      });

    return () => {
      controller.abort();
    };
  }, [activeNodeId, fetchPage]);

  const fetchNextPage = useCallback(() => {
    if (activeNodeId === null || loadingMore || loading || !hasMore) return;

    const nextPage = page + 1;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoadingMore(true);

    fetchPage(activeNodeId, nextPage, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setItems((prev) => [...prev, ...response.items]);
          setTotalCount(response.totalCount);
          setPage(nextPage);
          setLoadingMore(false);
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch items');
          setLoadingMore(false);
          lastFailedPageRef.current = nextPage;
        }
      });
  }, [activeNodeId, loadingMore, loading, hasMore, page, fetchPage]);

  const retry = useCallback(() => {
    if (activeNodeId === null) return;

    const retryPage = lastFailedPageRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setError(null);

    if (retryPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    fetchPage(activeNodeId, retryPage, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          if (retryPage === 1) {
            setItems(response.items);
          } else {
            setItems((prev) => [...prev, ...response.items]);
          }
          setTotalCount(response.totalCount);
          setPage(retryPage);
          setLoading(false);
          setLoadingMore(false);
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch items');
          setLoading(false);
          setLoadingMore(false);
        }
      });
  }, [activeNodeId, fetchPage]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchNextPage,
    retry,
  };
}
