import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  off,
  type Database,
  type Unsubscribe,
} from 'firebase/database';

import type {
  ClientStatus,
  Flag,
  FlagChangeListener,
  FlagMap,
  FlagValue,
  ParsedToken,
  RolloutlyConfig,
} from './types';

const DEFAULT_BASE_URL = 'https://rolloutly.com';
const CACHE_KEY = 'rolloutly_flags';

export class RolloutlyClient {
  private config: Required<
    Omit<RolloutlyConfig, 'defaultFlags'> & {
      defaultFlags: Record<string, FlagValue>;
    }
  >;
  private flags: FlagMap = {};
  private flagValuesCache: Record<string, FlagValue | undefined> = {};
  private status: ClientStatus = 'initializing';
  private error: Error | null = null;
  private listeners: Set<FlagChangeListener> = new Set();
  private parsedToken: ParsedToken;
  private firebaseApp: FirebaseApp | null = null;
  private database: Database | null = null;
  private realtimeUnsubscribe: Unsubscribe | null = null;
  private initPromise: Promise<void>;
  private initResolve!: () => void;
  private initReject!: (error: Error) => void;

  constructor(config: RolloutlyConfig) {
    this.config = {
      token: config.token,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      realtimeEnabled: config.realtimeEnabled ?? true,
      defaultFlags: config.defaultFlags ?? {},
      debug: config.debug ?? false,
    };

    // Parse the token
    const parsed = this.parseToken(config.token);

    if (!parsed) {
      throw new Error('Invalid SDK token format');
    }

    this.parsedToken = parsed;

    // Create init promise
    this.initPromise = new Promise((resolve, reject) => {
      this.initResolve = resolve;
      this.initReject = reject;
    });

    // Load cached flags first
    this.loadCachedFlags();

    // Start initialization
    void this.initialize();
  }

  /**
   * Wait for the client to be initialized
   */
  async waitForInit(): Promise<void> {
    return this.initPromise;
  }

  /**
   * Get a single flag value
   */
  getFlag<T extends FlagValue = FlagValue>(key: string): T | undefined {
    const flag = this.flags[key];

    if (flag) {
      return (flag.enabled ? flag.value : this.config.defaultFlags[key]) as T;
    }

    return this.config.defaultFlags[key] as T;
  }

  /**
   * Get all flags
   */
  getFlags(): FlagMap {
    return { ...this.flags };
  }

  /**
   * Get all flag values as a stable object (for React hooks)
   * Returns a cached object that only changes when flags change
   */
  getFlagValues(): Record<string, FlagValue | undefined> {
    return this.flagValuesCache;
  }

  /**
   * Check if a boolean flag is enabled
   */
  isEnabled(key: string): boolean {
    const flag = this.flags[key];

    if (!flag) {
      return Boolean(this.config.defaultFlags[key]);
    }

    if (!flag.enabled) {
      return Boolean(this.config.defaultFlags[key]);
    }

    return flag.type === 'boolean' ? Boolean(flag.value) : true;
  }

  /**
   * Get current client status
   */
  getStatus(): ClientStatus {
    return this.status;
  }

  /**
   * Get the last error if any
   */
  getError(): Error | null {
    return this.error;
  }

  /**
   * Subscribe to flag changes (for React useSyncExternalStore)
   */
  subscribe(listener: FlagChangeListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Cleanup and disconnect
   */
  close(): void {
    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = null;
    }

    if (this.database) {
      const flagsRef = ref(
        this.database,
        `flags/${this.parsedToken.projectId}/${this.parsedToken.environmentKey}`,
      );
      off(flagsRef);
    }

    this.listeners.clear();
    this.log('Client closed');
  }

  // ==================== Private Methods ====================

  private parseToken(token: string): ParsedToken | null {
    const parts = token.split('_');

    // Format: rly_{projectId}_{environmentKey}_{randomString}
    if (parts.length < 4 || parts[0] !== 'rly') {
      return null;
    }

    return {
      projectId: parts[1],
      environmentKey: parts[2],
    };
  }

  private async initialize(): Promise<void> {
    try {
      // Fetch initial flags from API
      await this.fetchFlags();

      // Set up real-time updates if enabled
      if (this.config.realtimeEnabled) {
        await this.setupRealtime();
      }

      this.status = 'ready';
      this.initResolve();
      this.log('Client initialized');
    } catch (err) {
      this.status = 'error';
      this.error = err instanceof Error ? err : new Error(String(err));
      this.initReject(this.error);
      this.log('Initialization failed:', this.error.message);
    }
  }

  private async fetchFlags(): Promise<void> {
    const url = `${this.config.baseUrl}/api/sdk/flags`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch flags: ${response.status}`);
    }

    const data = (await response.json()) as { flags: FlagMap };
    this.flags = data.flags;
    this.cacheFlags();
    this.notifyListeners();
    this.log('Flags fetched:', Object.keys(this.flags).length);
  }

  private async setupRealtime(): Promise<void> {
    // Initialize Firebase with minimal config for Realtime DB
    // The database URL is derived from the API response or configured
    const databaseURL = await this.getDatabaseUrl();

    if (!databaseURL) {
      this.log('Realtime DB URL not available, skipping real-time updates');

      return;
    }

    this.firebaseApp = initializeApp(
      {
        databaseURL,
      },
      `rolloutly-${Date.now()}`,
    );

    this.database = getDatabase(this.firebaseApp);

    const flagsRef = ref(
      this.database,
      `flags/${this.parsedToken.projectId}/${this.parsedToken.environmentKey}`,
    );

    this.realtimeUnsubscribe = onValue(
      flagsRef,
      (snapshot) => {
        const data = snapshot.val() as Record<string, Flag> | null;

        if (data) {
          // Convert realtime format to our flag format
          this.flags = Object.entries(data).reduce<FlagMap>(
            (acc, [key, flag]) => {
              acc[key] = { ...flag, key };

              return acc;
            },
            {},
          );
          this.cacheFlags();
          this.notifyListeners();
          this.log('Realtime update received');
        }
      },
      (error) => {
        this.log('Realtime error:', error.message);
      },
    );
  }

  private async getDatabaseUrl(): Promise<string | null> {
    // Try to get the database URL from the API
    try {
      const url = `${this.config.baseUrl}/api/sdk/config`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { databaseUrl?: string };

        return data.databaseUrl ?? null;
      }
    } catch {
      // Ignore - we'll try without realtime
    }

    return null;
  }

  private loadCachedFlags(): void {
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem(CACHE_KEY);

      if (cached) {
        this.flags = JSON.parse(cached) as FlagMap;
        this.updateFlagValuesCache();
        this.log('Loaded cached flags');
      }
    } catch {
      // Ignore cache errors
    }
  }

  private cacheFlags(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.flags));
    } catch {
      // Ignore cache errors
    }
  }

  private updateFlagValuesCache(): void {
    // Create a new cache object only when flags change
    this.flagValuesCache = Object.entries(this.flags).reduce<
      Record<string, FlagValue | undefined>
    >((acc, [key, flag]) => {
      acc[key] = flag.value;

      return acc;
    }, {});
  }

  private notifyListeners(): void {
    this.updateFlagValuesCache();
    this.listeners.forEach((listener) => listener());
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[Rolloutly]', ...args);
    }
  }
}
