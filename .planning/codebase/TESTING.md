# Testing Patterns

**Analysis Date:** 2026-07-29

## Test Framework

**Runner:**

- Not detected. The repo has no `jest.config.*`, `vitest.config.*`, Playwright/Cypress config, or `*.test.*` / `*.spec.*` files under `/home/user/Projects/noStrudel`.
- `package.json` has no `test`, `test:watch`, or `coverage` scripts.
- Current verification is build/typecheck driven: `package.json` runs `tsc --project tsconfig.json && vite build` through `pnpm build`.

**Assertion Library:**

- Not detected.
- No dedicated assertion packages are declared in `package.json` dev dependencies.

**Run Commands:**

```bash
pnpm build              # Run TypeScript typecheck and Vite production build
pnpm run format         # Format all project files with Prettier
# Not detected          # Watch mode
# Not detected          # Coverage
```

## Test File Organization

**Location:**

- Not detected. There are no co-located test files such as `src/**/*.test.ts`, `src/**/*.test.tsx`, `src/**/*.spec.ts`, or `src/**/*.spec.tsx`.
- There are no separate test directories such as `test/`, `tests/`, or `src/**/__tests__/` in the repo.

**Naming:**

- Not detected.
- If tests are added, use kebab-case filenames to match source conventions from `AGENTS.md`, such as `src/helpers/nostr/torrents.test.ts` or `src/hooks/use-async-action.test.tsx`.

**Structure:**

```text
Not detected in current repo.
Recommended placement, matching existing source layout:
src/helpers/nostr/
├── torrents.ts
└── torrents.test.ts
src/hooks/
├── use-async-action.ts
└── use-async-action.test.tsx
src/views/torrents/components/
├── torrent-table-row.tsx
└── torrent-table-row.test.tsx
```

## Test Structure

**Suite Organization:**

```typescript
// No in-repo suite pattern exists today.
// Use this shape when a runner is introduced:
describe("validateTorrent", () => {
  it("returns false when required torrent tags are missing", () => {
    // arrange: construct a NostrEvent-like object
    // act: call validateTorrent(event)
    // assert: expect(result).toBe(false)
  });
});
```

**Patterns:**

- No setup/teardown convention is currently defined in code.
- Prefer pure helper tests first because helpers such as `src/helpers/nostr/torrents.ts` have deterministic inputs/outputs and no React or relay dependencies.
- For React component tests, wrap components with the same providers used by views. Example: `src/views/torrents/index.tsx` wraps `TorrentsPage` with `PeopleListProvider` from `src/providers/local/people-list-provider.tsx`.
- For route-level tests, use route arrays as fixtures. Example: `src/views/torrents/routes.tsx` exports index/new/detail routes with `satisfies RouteObject[]`.
- For async action tests, assert the returned object shape and side effects of `run()` from `src/hooks/use-async-action.ts`.

## Mocking

**Framework:** Not detected

**Patterns:**

```typescript
// No mock framework pattern exists in this repo.
// When adding tests, mock at app boundaries rather than internal helper logic:
// - Nostr relay/pool services: `src/services/pool.ts`
// - Event store singleton: `src/services/event-store.ts`
// - Cache requests: `src/services/event-cache.ts`
// - Chakra toast for `src/hooks/use-async-action.ts`
```

**What to Mock:**

- Mock network and relay boundaries for hooks/components that load Nostr data. Examples: `pool` from `src/services/pool.ts`, `cacheRequest` from `src/services/event-cache.ts`, and `eventStore` from `src/services/event-store.ts` used by `src/hooks/use-timeline-loader.ts`.
- Mock browser/platform APIs for service worker and native code. Examples: service worker clients in `src/sw/client/cache.ts`, IndexedDB/service-worker storage in `src/sw/worker/error-handler.ts`, and Capacitor SQLite in `src/services/sqlite/index.ts`.
- Mock Chakra `useToast` when testing async error UI. `src/hooks/use-async-action.ts` calls `useToast()` and emits `{ description: e.message, status: "error" }`.
- Mock account/signing services for account UI. Examples: `useActiveAccount()` and `useAccountManager()` from `applesauce-react/hooks` in `src/views/torrents/index.tsx` and `src/views/settings/accounts/components/simple-signer-backup.tsx`.

**What NOT to Mock:**

- Do not mock pure Nostr helper functions when testing their behavior. Test `getTorrentTitle()`, `getTorrentBtih()`, `getTorrentFiles()`, `getTorrentSize()`, and `validateTorrent()` directly in `src/helpers/nostr/torrents.ts`.
- Do not mock formatting utilities for components that depend on visible output unless the formatter has external dependencies. Example: `formatBytes` imported by `src/views/torrents/components/torrent-table-row.tsx` can be covered directly or through component output.
- Do not mock React Router route config when testing that a feature exposes the expected routes; use `src/views/torrents/routes.tsx` as the source of truth.

## Fixtures and Factories

**Test Data:**

```typescript
// No shared fixture/factory files exist today.
// Use small NostrEvent-shaped builders for helpers:
const torrentEvent = {
  id: "event-id",
  pubkey: "pubkey",
  created_at: 1,
  kind: 2003,
  tags: [
    ["title", "Example torrent"],
    ["btih", "abcdef"],
    ["file", "example.mkv", "1024"],
  ],
  content: "",
  sig: "sig",
};
```

**Location:**

- Not detected.
- Keep one-off fixtures inside the test file until reused by multiple suites.
- If shared fixtures are introduced, mirror source domains under `src/test/fixtures/` or colocate factory files near the tested domain, such as `src/helpers/nostr/torrent-fixtures.ts`.

## Coverage

**Requirements:** None enforced

**View Coverage:**

```bash
# Not detected: no coverage command exists in package.json
pnpm build              # Current required verification gate
```

## Test Types

**Unit Tests:**

- Not currently present.
- Best initial targets are pure helpers in `src/helpers/nostr/`, formatting helpers in `src/helpers/`, and route arrays in `src/views/*/routes.tsx`.
- High-value unit targets include `src/helpers/nostr/torrents.ts`, `src/hooks/use-route-search-value.ts`, `src/hooks/use-timeline-loader.ts`, and `src/providers/local/people-list-provider.tsx`.

**Integration Tests:**

- Not currently present.
- Integration tests should cover provider + hook + component wiring for views that use applesauce/react-router/chakra contexts. Example target: `src/views/torrents/index.tsx` with `PeopleListProvider`, `IntersectionObserverProvider`, `useTimelineLoader`, and route search state.
- Service integration tests should isolate platform boundaries. Example targets: `src/sw/common/rpc-client.ts`, `src/sw/common/rpc-server.ts`, and `src/services/sqlite/index.ts`.

**E2E Tests:**

- Not used.
- No Playwright, Cypress, or WebDriver dependencies/configuration are declared in `package.json` or root config files.

## Common Patterns

**Async Testing:**

```typescript
// Pattern to verify once a test runner is introduced:
const action = useAsyncAction(async () => {
  throw new Error("Boom");
}, []);

await action.run();
// assert toast was called with { description: "Boom", status: "error" }
// assert loading returns to false
```

- Async component actions should be written with `useAsyncAction` from `src/hooks/use-async-action.ts`; tests should assert loading state and toast behavior rather than duplicating try/catch in components.
- For hooks using `useMemo` around relay loaders, such as `src/hooks/use-timeline-loader.ts`, tests should control dependency values (`key`, `relays`, `filters`) and assert loader creation only when filters and relays exist.

**Error Testing:**

```typescript
// Helper error/validation pattern from `src/helpers/nostr/torrents.ts`:
expect(() => getTorrentTitle(eventWithoutTitle)).toThrow("Missing title");
expect(validateTorrent(eventWithoutTitle)).toBe(false);
```

- Test both throwing extractors and boolean validators for Nostr event helpers. `getTorrentTitle()` and `getTorrentBtih()` throw; `validateTorrent()` catches and returns `false`.
- Test ErrorBoundary behavior around rendering failures using `src/components/error-boundary.tsx` once React component testing is available.
- Test service boundary failures as thrown/rejected errors. Example: importing or calling web-incompatible SQLite logic in `src/services/sqlite/index.ts` should surface the explicit web error.

---

_Testing analysis: 2026-07-29_
