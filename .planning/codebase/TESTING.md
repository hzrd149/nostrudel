# Testing Patterns

**Analysis Date:** 2026-07-01

## Test Framework

**Runner:**
- None. No test runner (Vitest, Jest, Mocha, etc.) is configured in `package.json` (`dependencies`/`devDependencies`), and no test config file (`vitest.config.*`, `jest.config.*`) exists in the repo root.
- No test files exist anywhere under `src/` — a full search for `*.test.*`, `*.spec.*`, and `__tests__` directories returned zero results.

**Assertion Library:**
- Not applicable — none configured.

**Run Commands:**
```bash
# No test script exists in package.json.
# Available scripts (package.json "scripts"):
pnpm start     # vite serve
pnpm dev       # vite serve with VITE_APP_VERSION=dev
pnpm build     # tsc --project tsconfig.json && vite build
pnpm format    # prettier --ignore-path .prettierignore -w .
```
There is no `pnpm test`, `pnpm lint`, or `pnpm typecheck` script; `pnpm build` is the closest thing to a correctness gate, since it runs `tsc` (type-checking) before `vite build`.

## Test File Organization

**Location:** Not applicable — no tests exist.

**Naming:** Not applicable.

**Structure:** Not applicable.

## Test Structure

Not applicable — no test suites exist to reference.

## Mocking

Not applicable — no mocking framework or patterns exist in the codebase.

## Fixtures and Factories

Not applicable — no fixture/factory patterns exist.

## Coverage

**Requirements:** None enforced. No coverage tooling is configured.

**View Coverage:**
```bash
# Not applicable — no coverage tooling present.
```

## Test Types

**Unit Tests:** Not present.

**Integration Tests:** Not present.

**E2E Tests:** Not present. No Playwright/Cypress/Puppeteer config or dependency found.

## Common Patterns

Not applicable.

## Recommendations for Introducing Tests

If a phase requires adding tests to this codebase, note the following since there is no existing pattern to follow:

- **Build tool:** The project uses Vite (`vite.config.ts`) with `@vitejs/plugin-react` and `vite-tsconfig-paths`, so **Vitest** is the natural fit (shares Vite config/transform pipeline, supports the `~/*` path alias already defined in `tsconfig.json`).
- **Candidates for first tests:** Pure helpers in `src/helpers/` (e.g. `src/helpers/nostr/*`, `src/helpers/array.ts`, `src/helpers/number.ts`) are framework-free and the easiest place to start, since they take `NostrEvent` objects and return primitives without React or network dependencies.
- **Nostr event fixtures:** None exist yet; any new test suite will need to hand-construct minimal `NostrEvent` objects (`nostr-tools` type) as fixtures — there is no existing fixture directory to reuse.
- **Applesauce testing guidance:** Per `.claude/skills/applesauce/SKILL.md`, a separate `EventStore` instance is acceptable for isolated tests (the hard rule against multiple stores only applies to overlapping/live data), which should inform any future test setup for code that touches `EventStore`/models/loaders.

---

*Testing analysis: 2026-07-01*
