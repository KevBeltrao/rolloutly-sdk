'use client';

import { RolloutlyClient, type FlagValue } from '@rolloutly/core';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from 'react';

import type { RolloutlyContextValue, RolloutlyProviderProps } from './types';

const RolloutlyContext = createContext<{
  client: RolloutlyClient | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}>({
  client: null,
  isLoading: true,
  isError: false,
  error: null,
});

/**
 * Provider component that initializes Rolloutly and provides context
 */
export function RolloutlyProvider({
  token,
  children,
  baseUrl,
  realtimeEnabled = true,
  defaultFlags,
  debug = false,
  loadingComponent,
}: RolloutlyProviderProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const client = useMemo(() => {
    return new RolloutlyClient({
      token,
      baseUrl,
      realtimeEnabled,
      defaultFlags,
      debug,
    });
  }, [token, baseUrl, realtimeEnabled, defaultFlags, debug]);

  useEffect(() => {
    let mounted = true;

    client
      .waitForInit()
      .then(() => {
        if (mounted) {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
      client.close();
    };
  }, [client]);

  const contextValue = useMemo(
    () => ({
      client,
      isLoading,
      isError,
      error,
    }),
    [client, isLoading, isError, error],
  );

  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  return (
    <RolloutlyContext.Provider value={contextValue}>
      {children}
    </RolloutlyContext.Provider>
  );
}

/**
 * Hook to access the Rolloutly client directly
 */
export function useRolloutlyClient(): RolloutlyClient {
  const { client } = useContext(RolloutlyContext);

  if (!client) {
    throw new Error('useRolloutlyClient must be used within RolloutlyProvider');
  }

  return client;
}

/**
 * Hook to get Rolloutly status
 */
export function useRolloutly(): RolloutlyContextValue {
  const { client, isLoading, isError, error } = useContext(RolloutlyContext);

  if (!client) {
    throw new Error('useRolloutly must be used within RolloutlyProvider');
  }

  const getFlag = useCallback(
    <T extends FlagValue = FlagValue>(key: string): T | undefined => {
      return client.getFlag<T>(key);
    },
    [client],
  );

  const isEnabled = useCallback(
    (key: string): boolean => {
      return client.isEnabled(key);
    },
    [client],
  );

  return {
    isLoading,
    isError,
    error,
    getFlag,
    isEnabled,
  };
}

/**
 * Hook to get a single flag value with real-time updates
 */
export function useFlag<T extends FlagValue = FlagValue>(
  key: string,
): T | undefined {
  const client = useRolloutlyClient();

  const getSnapshot = useCallback((): T | undefined => {
    return client.getFlag<T>(key);
  }, [client, key]);

  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      return client.subscribe(onStoreChange);
    },
    [client],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook to check if a boolean flag is enabled with real-time updates
 */
export function useFlagEnabled(key: string): boolean {
  const client = useRolloutlyClient();

  const getSnapshot = useCallback((): boolean => {
    return client.isEnabled(key);
  }, [client, key]);

  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      return client.subscribe(onStoreChange);
    },
    [client],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook to get all flag values with real-time updates
 * Returns an object keyed by flag key with the flag values
 *
 * @example
 * const flags = useFlags();
 * const value = flags['my-flag'];
 *
 * // Or with destructuring:
 * const { 'my-flag': myFlag } = useFlags();
 */
export function useFlags(): Record<string, FlagValue | undefined> {
  const client = useRolloutlyClient();

  const getSnapshot = useCallback((): Record<string, FlagValue | undefined> => {
    const flags = client.getFlags();

    return Object.entries(flags).reduce<Record<string, FlagValue | undefined>>(
      (acc, [key, flag]) => {
        acc[key] = flag.value;

        return acc;
      },
      {},
    );
  }, [client]);

  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      return client.subscribe(onStoreChange);
    },
    [client],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
