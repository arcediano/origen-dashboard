# Dashboard Smoke Tests Gate

## Overview

The dashboard smoke tests are a mandatory CI/CD gate to prevent regressions in critical paths before release. These tests validate that the home page and key sections of the dashboard load and function correctly.

## What Gets Tested

**Integration Smoke (mandatory)**
- Dashboard home renders without runtime errors
- All critical blocks are present (alerts, producer card, stats, orders, products, tabs)
- Quick actions grid exposes links to all key sections

**E2E Smoke (optional in CI)**
- All smoke routes load without 404 or application errors
- Authenticated navigation works correctly

See [tests/shared/dashboard-smoke-routes.ts](tests/shared/dashboard-smoke-routes.ts) for the full list of smoke routes.

## Running Locally

```bash
# Run integration smoke only
npm run test:smoke:dashboard:integration

# Run E2E smoke only (requires E2E_ACTIVE_PRODUCER credentials)
npm run test:smoke:dashboard:e2e

# Run both (combined gate)
npm run test:smoke:dashboard
```

## CI/CD Integration

The workflow [.github/workflows/dashboard-smoke.yml](../.github/workflows/dashboard-smoke.yml) runs on every:
- Push to `main` or `develop`
- Pull request against `main` or `develop`

Only when files in `origen-dashboard/` change or the workflow itself is modified.

### Gate Requirements

1. **Must pass**: Type checking (`tsc --noEmit`)
2. **Must pass**: Integration smoke tests
3. **Optional**: E2E smoke tests (skips gracefully if no credentials)

Failure to pass gates blocks merge to `main`.

## Adding New Dashboard Sections

When you add a new dashboard section:

1. **Add the route** to [tests/shared/dashboard-smoke-routes.ts](tests/shared/dashboard-smoke-routes.ts)
2. **Re-run smoke** locally before committing: `npm run test:smoke:dashboard`
3. **Verify in CI**: The workflow will automatically test your new route

Example:
```typescript
// tests/shared/dashboard-smoke-routes.ts
export const DASHBOARD_SMOKE_ROUTES = [
  '/dashboard',
  '/dashboard/orders',
  '/dashboard/new-section',  // Add your new route here
  // ... rest of routes
] as const;
```

## Troubleshooting

### Type Check Fails
```bash
npm run type-check
# Fix any TypeScript errors before committing
```

### Integration Tests Fail
```bash
npm run test:smoke:dashboard:integration
# Check console output for which block is missing or erroring
# Verify home component structure matches test expectations
```

### E2E Tests Skip
This is expected in CI without credentials. If you want to run E2E locally with real authentication:

```bash
export E2E_ACTIVE_PRODUCER_EMAIL=your-email@test.com
export E2E_ACTIVE_PRODUCER_PASSWORD=your-password
npm run test:smoke:dashboard:e2e
```

## Why This Gate?

The dashboard smoke tests catch common issues **before** they reach production:

- ✅ Missing component imports
- ✅ Broken route wiring
- ✅ Hook order violations (like the home bug that was caught during implementation)
- ✅ Runtime errors in critical paths
- ✅ API contract mismatches

This prevents the situation from earlier where a loading error escaped undetected until after release.
