---
phase: 1
slug: hidden-mutes-support-with-unlock-ux-and-decryption-cache
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `01-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test runner exists for the web app (`.planning/codebase/STACK.md`: no Jest/Vitest/Mocha dependency, no root test script) |
| **Config file** | none — and none is being added this phase (see Wave 0) |
| **Quick run command** | `pnpm build` (runs `tsc --project tsconfig.json`; strict mode is on — the fastest available correctness signal) |
| **Full suite command** | `pnpm build` (same command; also runs `vite build`, validating the production bundle) |
| **Estimated runtime** | ~60–120 seconds |

**Scope fence:** Do not introduce a test framework as part of this phase. Phase 2 ("Adopt a lint config and CI quality gate") is the designated place for quality tooling. If a planner judges targeted unit tests valuable for pure functions (e.g. `getMuteHalf`, the registry's `count$` derivations), that must be called out explicitly as **optional, additive, out-of-scope-unless-approved** — never a silent test-runner dependency.

---

## Sampling Rate

- **After every task commit:** Run `pnpm build` — tsc strict-mode check. This phase is mostly type-checked applesauce API calls, so the type checker catches the majority of wiring mistakes.
- **After every plan wave:** Run `pnpm build`, plus a manual pass through the Manual-Only Verifications rows touched by that wave.
- **Before `/gsd-verify-work`:** Full manual pass through every row in Manual-Only Verifications. There is no automated suite to catch behavioral regressions.
- **Max feedback latency:** ~120 seconds (build time) for automated signal; manual rows are wave-gated.

---

## Per-Task Verification Map

*Populated after planning. Verified by `gsd-plan-checker`: all nine M-rows trace to concrete manual blocks in the plans listed below.*

| Plan | Wave | Requirements | Threat Refs | Test Type | Automated Command | Manual Rows | Status |
|------|------|--------------|-------------|-----------|-------------------|-------------|--------|
| 01-01 | 1 | D-01, D-02, D-05, D-08 | T-01-01…T-01-04 | build + manual | `pnpm build` | M-1 | ⬜ pending |
| 01-02 | 1 | D-13, D-14, D-15 | T-01-05…T-01-08 | build + manual | `pnpm build` | M-8 (public half), M-9 | ⬜ pending |
| 01-03 | 2 | D-01, D-03, D-06, D-07, D-09 | T-01-09…T-01-13 | build + manual | `pnpm build` | M-3, M-4, M-6 | ⬜ pending |
| 01-04 | 3 | D-02, D-03, D-08, D-09 | T-01-14…T-01-17 | build + manual | `pnpm build` | M-2, M-5, M-6 | ⬜ pending |
| 01-05 | 3 | D-04, D-05 | T-01-18…T-01-19 | build + manual | `pnpm build` | M-1 | ⬜ pending |
| 01-06 | 3 | D-10, D-11, D-12 | T-01-20, T-01-21 | build + manual | `pnpm build` | M-7, M-8 (hidden half) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] **No framework install.** No test runner is added this phase — deliberate, see Scope fence above.
- [x] **Manual checklist landed in PLAN.md.** The real Wave 0 gap: every Manual-Only Verification row below must be written into the relevant plan's `<verify>` / acceptance criteria, because this project's Nyquist gate rests entirely on precise manual procedures rather than automated tests.
- [x] No `tests/` directory or fixtures exist. If a smoke check for a pure function is wanted, the smallest addition is an ad hoc `pnpm exec tsx` scratch script — **not** a full runner, and only with explicit user approval.

---

## Manual-Only Verifications

| # | Behavior | Requirement | Why Manual | Test Instructions |
|---|----------|-------------|------------|-------------------|
| M-1 | No auto-unlock signer call at startup | D-01 | Requires a real signer and observing the *absence* of a prompt | Reload the app with a mute list containing hidden entries and the decryption cache empty/locked. Confirm no signer popup / nostr-connect prompt appears without any click. |
| M-2 | Nav pending count is correct | D-02, D-03, D-09 | Needs live signer interaction | With a hidden-mute-containing list and a locked cache, load the app — badge reads 2. Unlock mutes only — badge reads 1. |
| M-3 | Cross-device replace re-locks, no auto re-unlock | D-06 | Needs a second publish path | Unlock hidden mutes in session A. From a second client (or by publishing a replacement kind-10000 event with different hidden content), replace the list. Confirm session A returns to locked (nav count increments) with no automatic re-unlock. |
| M-4 | Timelines silently under-filter while locked | D-07 | Filtering behavior needs observation; tsc only covers types | With a locked hidden mute for pubkey X, view a timeline containing an event from X — it appears (not filtered). Unlock, reload the timeline — X's events are now filtered. No banner appears at any point. |
| M-5 | Signer rejection toasts, stays pending, retryable | D-08 | Requires deliberately rejecting a signer prompt | Trigger unlock, then reject/cancel the signer prompt (deny in the NIP-07 extension, or time out a nostr-connect request). Confirm a toast appears, the nav badge count is unchanged, and Unlock can be clicked again without a page reload. |
| M-6 | Cache-lock unlock reachable outside Messages | D-09 | Needs real password / localforage state | With `encryptDecryptionCache` at its default (`true`) and never having visited `/messages`, confirm the pending-unlock mechanism offers a cache password prompt and that the correct password unlocks it (verify `decryptionCacheStats$.isLocked` becomes `false` via the debug API when `enableDebugApi` is on, or visit Messages and confirm `RequireDecryptionCache` no longer gates it). |
| M-7 | Private section, locked placeholder, pubkeys only | D-10, D-11, D-12 | Visual/behavioral; tsc only verifies prop types | Visit `/lists/muted` with a hidden-mute-containing, locked list: a separate "Private" section renders a locked placeholder with its own Unlock button and **no** entry count. Unlock — it lists private pubkeys only (no words/hashtags/threads), reusing the Public row UI. |
| M-8 | Unmute correctness across both halves | D-13, D-14 | Publish-and-reload verification is manual | Regression: mute a pubkey publicly, confirm Unmute removes it. Then mute a pubkey privately (raw applesauce action via debug console — "mute privately" has no UI this phase), unlock, and confirm Remove / Unmute actually removes it from the hidden half (re-check `getHiddenMutedThings` after publish + reload). Must not be a silent no-op. |
| M-9 | Merged `isMuted`, public-only while locked | D-15 | Behavioral; needs an unlock-state toggle to see both branches | With a pubkey muted only in the hidden half: while locked, the app-wide Mute menu shows "Mute" (the misreport D-15 accepts). Unlock — it shows "Unmute". |

---

## Validation Sign-Off

- [x] All tasks map to `pnpm build` or a numbered M-row above
- [x] Sampling continuity: no 3 consecutive tasks without a `pnpm build` checkpoint
- [x] Every M-row is written into a PLAN.md `<verify>` / acceptance criteria block (the real Wave 0 gap)
- [x] No watch-mode flags in any verify command
- [x] Feedback latency < 120s for automated signal
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-19 — gsd-plan-checker VERIFICATION PASSED against plans 01-01…01-06
