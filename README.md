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

## User Targeting

Rolloutly supports personalized flag values based on user attributes. Pass user context to enable targeting rules.

### React - Provider with User Context

```tsx
import { RolloutlyProvider } from '@rolloutly/react';

function App() {
  const currentUser = {
    userId: 'user-123',
    email: 'alice@example.com',
    orgId: 'acme-corp',
    plan: 'pro',
    role: 'admin',
    // Custom attributes
    betaUser: true,
    signupDate: '2024-01-15',
  };

  return (
    <RolloutlyProvider 
      token="rly_projectId_production_xxx"
      user={currentUser}
    >
      <MyApp />
    </RolloutlyProvider>
  );
}
```

### React - Dynamic User Identification

```tsx
import { useRolloutly } from '@rolloutly/react';

function LoginButton() {
  const { identify, reset } = useRolloutly();

  const handleLogin = async (user) => {
    // After successful login, identify the user
    await identify({
      userId: user.id,
      email: user.email,
      orgId: user.organizationId,
      plan: user.subscription.plan,
    });
  };

  const handleLogout = async () => {
    // Clear user context on logout
    await reset();
  };

  return (
    <>
      <button onClick={() => handleLogin(user)}>Login</button>
      <button onClick={handleLogout}>Logout</button>
    </>
  );
}
```

### Vanilla JavaScript - User Context

```typescript
import { RolloutlyClient } from '@rolloutly/core';

// Initialize with user context
const client = new RolloutlyClient({
  token: 'rly_your_token',
  user: {
    userId: 'user-123',
    email: 'alice@example.com',
    orgId: 'acme-corp',
    plan: 'pro',
  },
});

await client.waitForInit();

// Flags are now personalized based on targeting rules
if (client.isEnabled('premium-feature')) {
  // Show premium feature for pro users
}

// Update user context (e.g., after login)
await client.identify({
  userId: 'user-456',
  email: 'bob@example.com',
  plan: 'enterprise',
});

// Clear user context (e.g., on logout)
await client.reset();
```

### User Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `userId` | `string` | Unique user identifier |
| `email` | `string` | User's email address |
| `orgId` | `string` | Organization/company ID |
| `plan` | `string` | Subscription plan (e.g., 'free', 'pro', 'enterprise') |
| `role` | `string` | User's role (e.g., 'admin', 'user') |
| `[key]` | `string \| number \| boolean \| string[]` | Any custom attribute |

**Example targeting rules you can create:**
- "Enable for users where `email` contains `@mycompany.com`"
- "Enable for users where `plan` is one of `['pro', 'enterprise']`"
- "Enable for 50% of users where `orgId` equals `beta-org`"
- "Enable for users where `role` equals `admin`"

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
