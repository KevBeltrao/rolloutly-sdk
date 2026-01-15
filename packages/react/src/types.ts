import type { FlagValue, RolloutlyConfig, UserContext } from '@rolloutly/core';
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
  /** User context for targeting rules evaluation */
  user?: UserContext;
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
  /** Identify the user (update user context) */
  identify: (user: UserContext) => Promise<void>;
  /** Reset user context (e.g., on logout) */
  reset: () => Promise<void>;
};

/**
 * Options for RolloutlyProvider (used internally)
 */
export type RolloutlyOptions = Omit<RolloutlyConfig, 'token'>;
