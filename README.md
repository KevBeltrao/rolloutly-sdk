# Rolloutly SDK

Official SDKs for [Rolloutly](https://rolloutly.com) feature flags.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@rolloutly/core](./packages/core) | Core JavaScript SDK | [![npm](https://img.shields.io/npm/v/@rolloutly/core)](https://www.npmjs.com/package/@rolloutly/core) |
| [@rolloutly/react](./packages/react) | React hooks and provider | [![npm](https://img.shields.io/npm/v/@rolloutly/react)](https://www.npmjs.com/package/@rolloutly/react) |

## Quick Start

### React

```bash
npm install @rolloutly/react
```

```tsx
import { RolloutlyProvider, useFlags } from '@rolloutly/react';

function App() {
  return (
    <RolloutlyProvider token="rly_projectId_production_xxx">
      <MyApp />
    </RolloutlyProvider>
  );
}

function MyFeature() {
  // Get all flags as an object keyed by flag key
  const flags = useFlags();
  
  if (flags['new-feature']) {
    return <NewFeature config={flags['feature-config']} />;
  }
  
  return <OldFeature />;
}
```

### Vanilla JavaScript

```bash
npm install @rolloutly/core
```

```typescript
import { RolloutlyClient } from '@rolloutly/core';

const client = new RolloutlyClient({
  token: 'rly_your_token',
});

await client.waitForInit();

if (client.isEnabled('new-feature')) {
  // Show new feature
}
```

## Development

This is a monorepo using pnpm workspaces.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## License

MIT
