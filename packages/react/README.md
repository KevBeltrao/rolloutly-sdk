# @rolloutly/react

React SDK for [Rolloutly](https://rolloutly.com) feature flags.

## Installation

```bash
npm install @rolloutly/react
# or
pnpm add @rolloutly/react
# or
yarn add @rolloutly/react
```

## Quick Start

```tsx
import { RolloutlyProvider, useFlags, useFlagEnabled } from '@rolloutly/react';

// 1. Wrap your app with the provider
function App() {
  return (
    <RolloutlyProvider token="rly_projectId_production_xxx">
      <MyApp />
    </RolloutlyProvider>
  );
}

// 2. Use hooks in your components
function MyFeature() {
  // Get all flags as an object (recommended)
  const flags = useFlags();
  
  // Access flags by key
  if (flags['new-checkout']) {
    return <NewCheckout rateLimit={flags['rate-limit']} />;
  }

  return <OldCheckout />;
}

// Or check boolean flags with useFlagEnabled
function Banner() {
  const showBanner = useFlagEnabled('show-banner');
  
  if (showBanner) {
    return <PromoBanner />;
  }
  
  return null;
}
```

## Provider Configuration

```tsx
<RolloutlyProvider
  // Required: Your SDK token
  token="rly_xxx"
  
  // Optional: Custom API URL
  baseUrl="https://your-instance.com"
  
  // Optional: Enable real-time updates (default: true)
  realtimeEnabled={true}
  
  // Optional: Default values before flags load
  defaultFlags={{
    'new-feature': false,
    'api-rate-limit': 100,
  }}
  
  // Optional: User context for targeting rules
  user={{
    userId: 'user-123',
    email: 'alice@example.com',
    orgId: 'acme-corp',
    plan: 'pro',
  }}
  
  // Optional: Enable debug logging
  debug={false}
  
  // Optional: Component to show while loading
  loadingComponent={<Spinner />}
>
  <App />
</RolloutlyProvider>
```

## User Targeting

Pass user context to enable personalized flag values based on targeting rules.

### Static User Context

```tsx
function App() {
  const user = {
    userId: 'user-123',
    email: 'alice@example.com',
    orgId: 'acme-corp',
    plan: 'pro',
    role: 'admin',
    // Custom attributes
    betaUser: true,
  };

  return (
    <RolloutlyProvider token="rly_xxx" user={user}>
      <MyApp />
    </RolloutlyProvider>
  );
}
```

### Dynamic User Identification

Use `identify()` and `reset()` to manage user context dynamically:

```tsx
function AuthComponent() {
  const { identify, reset } = useRolloutly();

  const handleLogin = async (user) => {
    await identify({
      userId: user.id,
      email: user.email,
      orgId: user.organizationId,
      plan: user.subscription.plan,
    });
  };

  const handleLogout = async () => {
    await reset();
  };

  return (
    <>
      <button onClick={() => handleLogin(currentUser)}>Login</button>
      <button onClick={handleLogout}>Logout</button>
    </>
  );
}
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

## Hooks

### `useFlag<T>(key: string): T | undefined`

Get a single flag value with real-time updates.

```tsx
const rateLimit = useFlag<number>('api-rate-limit');
const config = useFlag<{ maxUsers: number }>('app-config');
```

### `useFlagEnabled(key: string): boolean`

Check if a boolean flag is enabled. Returns `false` if the flag doesn't exist or is disabled.

```tsx
const showBanner = useFlagEnabled('show-banner');

if (showBanner) {
  return <PromoBanner />;
}
```

### `useFlags(): Record<string, FlagValue | undefined>`

Get all flag values as a key-value object. This is the recommended way to access multiple flags.

**CamelCase Support:** Flag keys with hyphens or underscores are automatically available in camelCase for easy destructuring!

```tsx
const flags = useFlags();

// Access by original key
const myFeature = flags['instagram-integration'];

// Or use camelCase version (automatically available!)
const myFeature = flags.instagramIntegration;

// Clean destructuring with camelCase
const { instagramIntegration, newCheckout, showBanner } = useFlags();

// Both formats work:
// 'instagram-integration' -> instagramIntegration
// 'my_feature_flag' -> myFeatureFlag
```

### `useRolloutly(): RolloutlyContextValue`

Get the Rolloutly context including loading states, error handling, and user management.

```tsx
const { 
  isLoading, 
  isError, 
  error, 
  getFlag, 
  isEnabled,
  identify,  // Update user context
  reset,     // Clear user context
} = useRolloutly();

if (isLoading) return <Spinner />;
if (isError) return <Error message={error?.message} />;

// Identify user (e.g., after login)
await identify({ userId: 'user-123', email: 'alice@example.com' });

// Reset user context (e.g., on logout)
await reset();
```

### `useRolloutlyClient(): RolloutlyClient`

Get direct access to the Rolloutly client instance.

```tsx
const client = useRolloutlyClient();
const allFlags = client.getFlags();
```

## TypeScript

All hooks are fully typed. Use generics for type-safe flag values:

```tsx
// Boolean flag
const isEnabled = useFlagEnabled('feature');

// Typed flag values
const limit = useFlag<number>('rate-limit');
const config = useFlag<{ theme: string; maxItems: number }>('app-config');
```

## Server-Side Rendering (Next.js)

The provider includes `'use client'` directive and works with Next.js App Router. For server components, fetch flags server-side using `@rolloutly/core`:

```tsx
// app/layout.tsx
import { RolloutlyProvider } from '@rolloutly/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <RolloutlyProvider token={process.env.NEXT_PUBLIC_ROLLOUTLY_TOKEN!}>
          {children}
        </RolloutlyProvider>
      </body>
    </html>
  );
}
```

## License

MIT
