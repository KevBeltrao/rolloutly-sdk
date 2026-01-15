# @rolloutly/core

Core JavaScript SDK for [Rolloutly](https://rolloutly.com) feature flags.

## Installation

```bash
npm install @rolloutly/core
# or
pnpm add @rolloutly/core
# or
yarn add @rolloutly/core
```

## Usage

```typescript
import { RolloutlyClient } from '@rolloutly/core';

// Initialize the client
const client = new RolloutlyClient({
  token: 'rly_your_project_production_xxx',
});

// Wait for initialization
await client.waitForInit();

// Get a flag value
const showNewFeature = client.isEnabled('new-feature');

// Get a typed flag value
const rateLimit = client.getFlag<number>('api-rate-limit');

// Get all flags
const flags = client.getFlags();

// Subscribe to changes
const unsubscribe = client.subscribe(() => {
  console.log('Flags updated!');
});

// Cleanup when done
client.close();
```

## Configuration

```typescript
const client = new RolloutlyClient({
  // Required: Your SDK token
  token: 'rly_xxx',

  // Optional: Custom API URL (default: https://rolloutly.com)
  baseUrl: 'https://your-instance.com',

  // Optional: Enable real-time updates (default: true)
  realtimeEnabled: true,

  // Optional: Default values before flags load
  defaultFlags: {
    'new-feature': false,
    'api-rate-limit': 100,
  },

  // Optional: User context for targeting rules
  user: {
    userId: 'user-123',
    email: 'alice@example.com',
    orgId: 'acme-corp',
    plan: 'pro',
  },

  // Optional: Enable debug logging (default: false)
  debug: true,
});
```

## User Targeting

Pass user context to enable personalized flag values based on targeting rules.

```typescript
const client = new RolloutlyClient({
  token: 'rly_xxx',
  user: {
    userId: 'user-123',
    email: 'alice@example.com',
    orgId: 'acme-corp',
    plan: 'pro',
    role: 'admin',
    // Custom attributes
    betaUser: true,
    signupDate: '2024-01-15',
  },
});

await client.waitForInit();

// Flags are personalized based on targeting rules
if (client.isEnabled('premium-feature')) {
  // Show premium feature
}

// Update user context (e.g., after login)
await client.identify({
  userId: 'user-456',
  email: 'bob@example.com',
  plan: 'enterprise',
});

// Clear user context (e.g., on logout)
await client.reset();

// Get current user context
const currentUser = client.getUser();
```

### User Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `userId` | `string` | Unique user identifier |
| `email` | `string` | User's email address |
| `orgId` | `string` | Organization/company ID |
| `plan` | `string` | Subscription plan |
| `role` | `string` | User's role |
| `[key]` | `string \| number \| boolean \| string[]` | Custom attributes |

## API Reference

### `RolloutlyClient`

#### Methods

- `waitForInit(): Promise<void>` - Wait for the client to initialize
- `getFlag<T>(key: string): T | undefined` - Get a single flag value
- `getFlags(): FlagMap` - Get all flags
- `isEnabled(key: string): boolean` - Check if a boolean flag is enabled
- `getStatus(): ClientStatus` - Get client status ('initializing' | 'ready' | 'error')
- `getError(): Error | null` - Get the last error
- `subscribe(listener: () => void): () => void` - Subscribe to flag changes
- `identify(user: UserContext): Promise<void>` - Update user context and re-fetch flags
- `reset(): Promise<void>` - Clear user context and re-fetch flags
- `getUser(): UserContext | undefined` - Get current user context
- `close(): void` - Cleanup and disconnect

## For React

For React applications, use `@rolloutly/react` which provides hooks and a provider:

```bash
npm install @rolloutly/react
```

See [@rolloutly/react](../react) for more information.

## License

MIT
