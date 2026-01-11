import type { FlagValue, RolloutlyConfig } from '@rolloutly/core';
import type { ReactNode } from 'react';

/**
 * Props for the RolloutlyProvider component
 */
export type RolloutlyProviderProps = {
  /** SDK token */
  token: string;
  /** Child components */
  children: ReactNode;
  /** Base URL for the API */
  baseUrl?: string;
  /** Enable real-time updates */
  realtimeEnabled?: boolean;
  /** Default flag values */
  defaultFlags?: Record<string, FlagValue>;
  /** Enable debug logging */
  debug?: boolean;
  /** Component to show while loading */
  loadingComponent?: ReactNode;
};

/**
 * Rolloutly context value
 */
export type RolloutlyContextValue = {
  /** Whether the client is still loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** The error if any */
  error: Error | null;
  /** Get a flag value */
  getFlag: <T extends FlagValue = FlagValue>(key: string) => T | undefined;
  /** Check if a boolean flag is enabled */
  isEnabled: (key: string) => boolean;
};

/**
 * Options for RolloutlyProvider (used internally)
 */
export type RolloutlyOptions = Omit<RolloutlyConfig, 'token'>;
