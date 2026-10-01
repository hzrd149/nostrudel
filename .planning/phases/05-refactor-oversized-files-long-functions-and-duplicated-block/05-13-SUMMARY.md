---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 13
subsystem: testing
tags: [vitest, unit-tests, napplet-permissions, nwc, wallets]

requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: permissions module (05-10) and wallet nwc module (05-09) extracted as pure, testable units
provides:
  - exact-pinned vitest 5.0.1 runner with a standalone node-environment config
  - non-watch `pnpm test` script and planning test_command flipped to it
  - permission decision tests proving closed-by-default capability behaviour
  - NWC transaction mapper tests
affects: [future testing phases, CI]

tech-stack:
  added: [vitest 5.0.1 (exact pin)]
  patterns:
    - "Explicit vitest imports (no globals); test files live beside the module under test"
    - "In-memory localStorage stub via vi.stubGlobal for node-environment tests"
    - "vi.mock of side-effectful modules (preferences) instead of faking a browser environment"

key-files:
  created:
    - vitest.config.ts
    - src/services/napplet-shell/permissions.test.ts
    - src/services/wallets/nwc.test.ts
  modified:
    - package.json
    - pnpm-lock.yaml
    - .planning/config.json

key-decisions:
  - "vitest pinned exactly at 5.0.1 (human-approved at the blocking legitimacy checkpoint) over 4.1.11 and over the new latest 5.0.3"
  - "vitest.config.ts is standalone; vite.config.ts untouched; no globals; node environment"
  - "preferences module is stubbed with vi.mock in nwc.test.ts because it reads Capacitor storage through window at import time"

patterns-established:
  - "Test files colocated as *.test.ts under src and type-checked by pnpm build"

requirements-completed: []

duration: ~15min
completed: 2026-10-01
status: complete
---

# Phase 5 Plan 13: Test runner and focused tests Summary

**Exact-pinned vitest 5.0.1 with a standalone node config, 17 passing tests proving napplet permission decisions are closed by default and covering the NWC transaction mapper.**

## Task 1: Package legitimacy checkpoint (no commit, by design)

`gsd-tools query package-legitimacy check --ecosystem npm vitest` re-run 2026-10-01 returned verdict **SUS**, single reason `too-new`, evaluated against the current latest 5.0.3 (published 2026-09-30), not 5.0.1. Signals: package exists, ~130.2M weekly downloads, repository git+https://github.com/vitest-dev/vitest.git, not deprecated, no postinstall. 5.0.1 was published 2026-09-15; peer vite `^6.4.0 || ^7.0.0 || ^8.0.0` (repo pins ^8.1.5); engines.node `^22.12.0 || ^24.0.0 || >=26.0.0` (CI Node 24, local Node 26); no install scripts; integrity sha512-iA95lQbKEkvrtTkdAgnWbXfbipWiiWe/hDl2P5tMi6WFwD76G0NxXAGp/M9EOcYupeGJRr6wppMc7CoA41TQjg==.

**Human approval:** "approved: 5.0.1", a genuine human decision recorded by the orchestrator via an interactive question. The approver chose 5.0.1 over 4.1.11 and over the new latest 5.0.3. Install used `pnpm add -D --save-exact vitest@5.0.1` and succeeded without any release-age refusal; `pnpm-workspace.yaml` is untouched.

## Accomplishments

- Runner installed exact-pinned (`jq -r .devDependencies.vitest package.json` returns `5.0.1`), `test` script is `vitest run` (non-watch).
- `vitest.config.ts` is standalone (node environment, `src/**/*.test.ts` include); `vite.config.ts` unchanged.
- `permissions.test.ts` (10 tests): closed-by-default (identity with no grant reports false), grant true/false split, runtime `aclState.grant` called with identity fields via a fake bridge, revoke, revoke of never-granted identity is a no-op, identity keying differs on each of pubkey/dTag/aggregateHash and ignores title, always-allow round trip over an in-memory localStorage stub reset in `beforeEach`.
- `nwc.test.ts` (7 tests) written against the real `fromNwcTransaction`: msats to sats flooring for amount and fee, direction mapping, pending flag, `settled_at` fallback to `created_at`, absent/zero fee gives undefined, id fallback chain (payment_hash, invoice, `created_at:amount`), description passthrough and absence.
- `.planning/config.json` `test_command` flipped from `pnpm build` to `pnpm test`; `build_command` unchanged.

## Task Commits

1. Task 1: checkpoint, no commit by design.
2. Task 2: `175ce979e` test(05-13): add exact-pinned vitest runner with permission decision tests (single commit with package.json, pnpm-lock.yaml, vitest.config.ts, .planning/config.json, permissions.test.ts).
3. Task 3: `3d8d205eb` test(05-13): cover the NWC transaction mapper.

## Why D-15 reopens a question Phase 3 closed

Phase 3 rejected a test framework as its own phase. D-15 deliberately overturns that for a specific reason: this phase relocates roughly 1,750 lines of behaviour-bearing code with zero coverage, where the type checker proves types but nothing proves behaviour. CONCERNS.md prescribes keeping permission storage and grant decisions in pure functions with unit tests, and the D-08 split is what finally made them testable. D-17 places the harness last because before the split there was nothing pure to test. Scope is held deliberately narrow: exactly two test files, nothing for views or components.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] nwc.ts import fails in node environment**
- **Found during:** Task 3
- **Issue:** Importing `./nwc` pulls in `../preferences`, which at module load calls Capacitor `Preferences.get`, which reads `window`; the node environment has none (`ReferenceError: window is not defined`).
- **Fix:** `vi.mock("../preferences", () => ({ default: {} }))` in `nwc.test.ts`, keeping the node environment and leaving source untouched.
- **Files modified:** src/services/wallets/nwc.test.ts
- **Commit:** 3d8d205eb

**2. Capability literals:** the tests use real `Capability` union values (`"relay:write"`, `"state:write"`) typed directly rather than casts, so the build type-checks them.

## Verification

- `pnpm test`: 2 files, 17 tests passed.
- `pnpm build`: exit 0.
- `vite.config.ts` and `pnpm-workspace.yaml` unchanged; `git ls-files 'src/**/*.test.ts'` returns 2; no view/component tests.

## Known Stubs

None.

## Threat Flags

None. T-05-SC mitigated (blocking human checkpoint, exact pin, no install script); T-05-49 mitigated (closed-by-default asserted individually); T-05-50 mitigated (single commit); T-05-51 mitigated (storage stub recreated per test).

## Self-Check: PASSED

Created files and commits 175ce979e and 3d8d205eb verified present.
