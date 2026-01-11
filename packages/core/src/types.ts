/**
 * Possible flag value types
 */
export type FlagValue = boolean | string | number | Record<string, unknown>;

/**
 * Flag data structure from the API/Realtime DB
 */
export type Flag = {
  key: string;
  enabled: boolean;
  value: FlagValue;
  type: 'boolean' | 'string' | 'number' | 'json';
};

/**
 * Map of flag keys to their data
 */
export type FlagMap = Record<string, Flag>;

/**
 * Configuration options for RolloutlyClient
 */
export type RolloutlyConfig = {
  /** SDK token (format: rly_projectId_environmentKey_xxx) */
  token: string;
  /** Base URL for the API (default: https://rolloutly.com) */
  baseUrl?: string;
  /** Enable real-time updates via Firebase (default: true) */
  realtimeEnabled?: boolean;
  /** Default flag values to use before flags are loaded */
  defaultFlags?: Record<string, FlagValue>;
  /** Enable debug logging (default: false) */
  debug?: boolean;
};

/**
 * Client status
 */
export type ClientStatus = 'initializing' | 'ready' | 'error';

/**
 * Listener callback for flag changes
 */
export type FlagChangeListener = () => void;

/**
 * Parsed token data
 */
export type ParsedToken = {
  projectId: string;
  environmentKey: string;
};
