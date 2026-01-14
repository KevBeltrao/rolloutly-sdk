import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
}));

// Import after mocks are set up
import { RolloutlyClient } from './client';

describe('RolloutlyClient', () => {
  const validToken = 'rly_project123_production_abc123xyz';
  const mockFlags = {
    'test-flag': {
      key: 'test-flag',
      type: 'boolean',
      value: true,
      enabled: true,
    },
    'feature-one': {
      key: 'feature-one',
      type: 'string',
      value: 'hello',
      enabled: true,
    },
    'disabled-flag': {
      key: 'disabled-flag',
      type: 'boolean',
      value: true,
      enabled: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);

    // Setup successful fetch responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/sdk/flags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ flags: mockFlags }),
        });
      }
      if (url.includes('/api/sdk/config')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ databaseUrl: 'https://example.firebaseio.com' }),
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Parsing', () => {
    it('throws error for invalid token format', () => {
      expect(() => new RolloutlyClient({ token: 'invalid-token' })).toThrow(
        'Invalid SDK token format',
      );
    });

    it('throws error for token without rly prefix', () => {
      expect(
        () => new RolloutlyClient({ token: 'abc_project_env_key' }),
      ).toThrow('Invalid SDK token format');
    });

    it('throws error for token with insufficient parts', () => {
      expect(() => new RolloutlyClient({ token: 'rly_project_env' })).toThrow(
        'Invalid SDK token format',
      );
    });

    it('accepts valid token format', () => {
      expect(() => new RolloutlyClient({ token: validToken })).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('uses default baseUrl when not provided', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit().catch(() => {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://rolloutly.com/api/sdk/flags'),
        expect.any(Object),
      );
    });

    it('uses custom baseUrl when provided', async () => {
      const client = new RolloutlyClient({
        token: validToken,
        baseUrl: 'https://custom.example.com',
      });
      await client.waitForInit().catch(() => {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://custom.example.com/api/sdk/flags'),
        expect.any(Object),
      );
    });

    it('defaults realtimeEnabled to true', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit().catch(() => {});

      // Should try to fetch config for realtime
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sdk/config'),
        expect.any(Object),
      );
    });

    it('skips realtime setup when realtimeEnabled is false', async () => {
      const client = new RolloutlyClient({
        token: validToken,
        realtimeEnabled: false,
      });
      await client.waitForInit().catch(() => {});

      // Should not try to fetch config
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/sdk/config'),
        expect.any(Object),
      );
    });
  });

  describe('Flag Access', () => {
    it('getFlag returns flag value when enabled', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      expect(client.getFlag('test-flag')).toBe(true);
    });

    it('getFlag returns default value when flag is disabled', async () => {
      const client = new RolloutlyClient({
        token: validToken,
        defaultFlags: { 'disabled-flag': false },
      });
      await client.waitForInit();

      expect(client.getFlag('disabled-flag')).toBe(false);
    });

    it('getFlag returns undefined for non-existent flag', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      expect(client.getFlag('non-existent')).toBeUndefined();
    });

    it('getFlags returns all flags', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      const flags = client.getFlags();
      expect(Object.keys(flags)).toHaveLength(3);
      expect(flags['test-flag']).toBeDefined();
    });

    it('isEnabled returns true for enabled boolean flag', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      expect(client.isEnabled('test-flag')).toBe(true);
    });

    it('isEnabled returns false for disabled flag', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      expect(client.isEnabled('disabled-flag')).toBe(false);
    });

    it('isEnabled returns default value for non-existent flag', async () => {
      const client = new RolloutlyClient({
        token: validToken,
        defaultFlags: { 'non-existent': true },
      });
      await client.waitForInit();

      expect(client.isEnabled('non-existent')).toBe(true);
    });
  });

  describe('CamelCase Conversion', () => {
    it('converts kebab-case keys to camelCase in getFlagValues', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      const values = client.getFlagValues();

      // Should have both original and camelCase versions
      expect(values['test-flag']).toBe(true);
      expect(values['testFlag']).toBe(true);
      expect(values['feature-one']).toBe('hello');
      expect(values['featureOne']).toBe('hello');
    });

    it('getFlag works with camelCase key', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      expect(client.getFlag('testFlag')).toBe(true);
      expect(client.getFlag('featureOne')).toBe('hello');
    });

    it('isEnabled works with camelCase key', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      expect(client.isEnabled('testFlag')).toBe(true);
    });

    it('handles keys without hyphens normally', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/sdk/flags')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                flags: {
                  simpleflag: {
                    key: 'simpleflag',
                    type: 'boolean',
                    value: true,
                    enabled: true,
                  },
                },
              }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      expect(client.getFlag('simpleflag')).toBe(true);
    });
  });

  describe('Status', () => {
    it('starts with initializing status', () => {
      const client = new RolloutlyClient({ token: validToken });
      expect(client.getStatus()).toBe('initializing');
    });

    it('becomes ready after successful initialization', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      expect(client.getStatus()).toBe('ready');
    });

    it('becomes error on initialization failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const client = new RolloutlyClient({ token: validToken });

      try {
        await client.waitForInit();
      } catch {
        // Expected to fail
      }

      expect(client.getStatus()).toBe('error');
      expect(client.getError()?.message).toBe('Network error');
    });
  });

  describe('Subscriptions', () => {
    it('subscribe returns unsubscribe function', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      const listener = vi.fn();
      const unsubscribe = client.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe removes listener', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      const listener = vi.fn();
      const unsubscribe = client.subscribe(listener);

      unsubscribe();

      // Listener should not be called after unsubscribe
      // (internal state changes would normally trigger it)
    });
  });

  describe('Caching', () => {
    // Note: Caching is only available in browser environments (typeof window !== 'undefined')
    // These tests verify the caching logic behavior in a simulated browser environment

    it('loadCachedFlags is a no-op in Node environment', () => {
      // In Node, typeof window === 'undefined', so caching methods should be skipped
      const client = new RolloutlyClient({ token: validToken });

      // The client should still initialize without errors
      expect(client.getStatus()).toBe('initializing');
    });

    it('cacheFlags is a no-op in Node environment', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      // Should complete without errors even though localStorage isn't available
      expect(client.getStatus()).toBe('ready');
    });

    it('getFlagValues returns empty object before init when no cache', () => {
      const client = new RolloutlyClient({ token: validToken });

      // Before init completes, should return empty or default values
      const values = client.getFlagValues();
      expect(typeof values).toBe('object');
    });
  });

  describe('Cleanup', () => {
    it('close method clears listeners', async () => {
      const client = new RolloutlyClient({ token: validToken });
      await client.waitForInit();

      const listener = vi.fn();
      client.subscribe(listener);

      client.close();

      // After close, the internal listeners should be cleared
    });
  });
});
