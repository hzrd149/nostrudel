---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 14
subsystem: build-config
tags: [vite, define, web-worker, pow, gap-closure]
requires:
  - phase: 04-13
    provides: MinePOW unmount teardown and publish-failure recovery
provides:
  - "vite define aliases global to globalThis, so the dev /@vite/env prelude evaluates in module workers"
  - "src/polyfill.ts aliases global to the same realm-agnostic object"
  - "debug session parked at awaiting_human_verify"
affects: [04-UAT re-run, PoW composer tests 1-4]
tech-stack:
  added: []
  patterns: ["Vite inlines string define values raw into the dev env prelude, so a define value must be valid in every JS realm"]
key-files:
  created: []
  modified:
    - vite.config.ts
    - src/polyfill.ts
    - .planning/debug/pow-workers-fail-to-load.md
key-decisions:
  - "Use globalThis (not window/self/removal) for the global define: same object as window on the main thread, exists in workers and the service worker, keeps 74ece28df's build-time rewrite"
requirements-completed: [D-12]
status: complete
duration: ~35min
completed: 2026-10-01
---

# Phase 4 Plan 14: Dev PoW worker prelude fix Summary

One-line fix in `vite.config.ts` (`global: "window"` to `global: "globalThis"`) so Vite's dev `/@vite/env` prelude no longer throws `window is not defined` in PoW miner module workers. Runtime confirmation is deferred to the UAT re-run.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Alias `global` to `globalThis` in the Vite define | 7ab167469 | vite.config.ts |
| 2 | Point the main-thread `global` polyfill at `globalThis` | 73668e40e | src/polyfill.ts |
| 3 | Record the applied fix in the debug session | ba4505149 | .planning/debug/pow-workers-fail-to-load.md |

## Verification evidence (static only)

- Prelude check (Vite's real `vite:client-inject` transform on the real config, evaluated in a window-less vm context), last line of output:
  - RED, before the edit: `WORKER_PRELUDE_FAIL window is not defined`
  - GREEN, after the edit: `WORKER_PRELUDE_OK`
- `pnpm build` exits 0 after Task 1 and after Task 2.
- Post-build witnesses in `dist/`:
  - `grep -Fc 'typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : {}' dist/sw.js` = 1
  - `grep -Fc 'typeof global !== "undefined"' dist/sw.js` = 0 (define still applied, 74ece28df preserved)
  - One miner bundle, `dist/assets/miner-CpFg6wop.js`, which matches the expected name; `@vite/env` count 0.
- Task 1 gates: `global: "globalThis",` count 1; old value gone from code lines (0); comment lines 7 (budget 7).
- Task 2 gate: `POLYFILL_OK`; file still 4 lines.
- Task 3 gate: `HANDOFF_OK` (status awaiting_human_verify, files_changed exact, no stale placeholders, `cleanup();` and `stopMiner();` each 1). The Evidence section is 62 lines, unchanged. No 04-14 commit touched `src/components/pow/`, `short-text-form.tsx` or `post-modal/index.tsx`. `04-UAT.md` untouched.
- aislop (repo-wide): total 664 diagnostics (unchanged from baseline); error-severity excluding `react-hooks/rules-of-hooks` = 0; `vite.config.ts` = 2 and `src/polyfill.ts` = 2 (both pre-existing baselines).
- Commit chain: `git log a42dbdcf4..HEAD` shows the three 04-14 commits plus this SUMMARY commit.

## Deviations from Plan

None to the code. Two process notes:

- The session was interrupted once (the shell was killed with exit 137, likely OOM, while running `pnpm build` and aislop back to back). Task 2's build had already exited 0 and its `POLYFILL_OK` check had passed. I re-ran aislop alone for the polyfill count and the repo-wide bars, then committed.
- `node_modules` was absent in the fresh worktree, so I ran `pnpm install --frozen-lockfile --prefer-offline` (no changes to `package.json` or the lockfile).

## Documentation gaps (measured facts that no longer matched)

- The plan states there is no test runner and 0 test files. At execution time `vitest` 5.0.1 is installed, `package.json` has `"test": "vitest run"`, and Phase 05 added `src/services/napplet-shell/permissions.test.ts` and `src/services/wallets/nwc.test.ts`. This is a documentation gap, not a regression, and is not one of this plan's gates (the orchestrator runs `pnpm test` post-merge).
- Plan-time base was `70b353f16`; execution base is `a42dbdcf4` (planning-docs commits only). All measured numbers (664 diagnostics, 5 comment lines before, miner hash) matched.

## Known Stubs

None.

## Threat Flags

None. No new network, auth or file-access surface.

## Runtime confirmation required (UAT re-run)

Not verifiable here, so it goes to the UAT re-run and is not claimed as covered. Restart
`pnpm dev` and hard-reload the tab so the browser refetches `/@vite/env`. Then:

- **Test 2, both composers.** In `src/views/new/note/` and in the post modal, set difficulty above 0
  and submit. There should be no `ReferenceError: window is not defined`, the progress bar should
  advance, "Found POW" should appear, and the note should publish. This is the debug session's
  falsification test: if workers still throw or still mine zero hashes, there is another dev-only
  `window` reference in the worker graph and the diagnosis is incomplete.
- **Test 4.** Force a publish failure after mining completes. The form should return with the text
  intact and an error toast, and mining should not restart.
- **Test 3, post-"Found POW" window.** Dismiss within ~800 ms after "Found POW" appears. No note
  should be published and no Worker threads should survive.
- **Test 1, deferred note.** The worker pool should now mine hashes, and the DevTools Threads panel
  should show the workers gone after completion (D-12 `cleanup()`).
- **Expected noise.** The `Dropped napplet message ... unregistered-window` debug lines and the
  `polyfill global` console line are unrelated and will still appear. They are not failures.

Both 04-UAT.md gap entries (round 1 / test 1 and round 2 / test 2) are confirmed or refuted by that re-run, not by this plan.

## Self-Check: PASSED

- vite.config.ts, src/polyfill.ts, the debug session and this SUMMARY exist.
- Commits 7ab167469, 73668e40e, ba4505149 are present on `worktree-agent-a0a670072b6cbaf3f`.
