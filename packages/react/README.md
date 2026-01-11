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
import { RolloutlyProvider, useFlag, useFlagEnabled } from '@rolloutly/react';

// 1. Wrap your app with the provider
function App() {
  return (
    <RolloutlyProvider token="rly_your_project_production_xxx">
      <MyApp />
    </RolloutlyProvider>
  );
}

// 2. Use hooks in your components
function MyFeature() {
  const isNewCheckout = useFlagEnabled('new-checkout');
  const rateLimit = useFlag<number>('api-rate-limit');

  if (isNewCheckout) {
    return <NewCheckout rateLimit={rateLimit} />;
  }

  return <OldCheckout />;
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
  
  // Optional: Enable debug logging
  debug={false}
  
  // Optional: Component to show while loading
  loadingComponent={<Spinner />}
>
  <App />
</RolloutlyProvider>
```

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

### `useFlags(): Record<string, FlagValue>`

Get all flags as a key-value object.

```tsx
const flags = useFlags();
console.log(flags['my-feature']); // true
```

### `useRolloutly(): RolloutlyContextValue`

Get the Rolloutly context including loading and error states.

```tsx
const { isLoading, isError, error, getFlag, isEnabled } = useRolloutly();

if (isLoading) return <Spinner />;
if (isError) return <Error message={error?.message} />;
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
