---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
verified: 2026-10-01T00:00:00Z
status: human_needed
score: 7/8 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "The relocated/extracted behaviour-bearing code (napplet shell services, wallet backends, useWebxdc sub-hooks, post-modal body branches, webxdc request dispatch) behaves as before the move"
    test: "Exercise the runtime paths listed under human_verification (napplet consent/deny/always-allow, wallets, webxdc, PoW compose + mid-mine dismissal, DM relay lists)"
    expected: "Each path behaves identically to pre-phase; effect cleanups and cancellation (webxdc realtime leave/unmount, mining dismissal) still release resources"
    why_human: "Only the permission-decision functions and the NWC transaction mapper have tests (17 tests). Hook ordering, effect cleanup, cancellation and UI rendering cannot be proven by grep or tsc"
human_verification:
  - test: "Napplet consent flow: load a napplet that requests ungranted capabilities; choose Deny, Allow once, Always allow; dismiss with ESC/overlay; trigger an intent with no/multiple handlers"
    expected: "Modal appears; deny refuses on next request; allow-once does not survive frame reload; always-allow persists and skips the prompt; dismissal is treated as deny; intent-choice routes to the chosen napplet and cancel resolves with no handler"
    why_human: "Modal rendering and the provider-to-modal promise wiring are UI/runtime behaviour (05-10, 05-12 outstanding lists)"
  - test: "Napplet services end-to-end: Blossom upload, resource.bytes / resource.bytesMany with and without resource:fetch grant, common actions (follow/react/report), signature verification via the late-bound verifyEvent"
    expected: "Unapproved non-Blossom origins denied; batch returns per-URL results; valid/invalid signatures accepted/rejected"
    why_human: "No test runner covers these services (05-11 outstanding list)"
  - test: "Wallets: connect WebLN, NWC and NIP-60 wallets; balance, history, create invoice, pay, rename, remove, unlock"
    expected: "Identical to pre-split behaviour"
    why_human: "Wallet backends need live extension/relay/mint (05-09 outstanding list); only nwc transaction mapping is unit-tested"
  - test: "Post-modal composer: plain post, PoW mine-and-publish, dismiss mid-mine; webxdc mini-app calling sendUpdate/setUpdateListener/getAllUpdates/sendToChat/importFiles and realtime channel join/send/leave"
    expected: "Exactly one publish; no re-mine loop; dismissal tears down workers and publishes nothing; webxdc requests and unknown-method error unchanged; leave() aborts subscription"
    why_human: "Hook effect cleanup and worker teardown are runtime behaviours (05-07, 05-08 outstanding lists)"
  - test: "Background-worker settings cards: per-row Clear spinner, Clear All, Update offline cache, Check for Update (three toast variants); and the error toast on a forced failure"
    expected: "Loading/disabled states render per row; toasts appear. Note the error toast is now `description: e.message` only (see WR-02)"
    why_human: "Loading-state conversion class that Phase 3 D-09 also left unverified (05-04 outstanding list)"
  - test: "Magic autocomplete (:, @ triggers in MagicInput and MagicTextArea, ref focus), article-reader voice sliders, error-logger console grouping, notifications loaders replay on re-open"
    expected: "Unchanged behaviour (05-05, 05-06 outstanding lists)"
    why_human: "UI/devtools output"
  - test: "Direct-message settings modal: relay lists and NIP-17-self empty-state Alert; send one NIP-17 and one NIP-04 message"
    expected: "Correct relay lists and empty states; send completes to the right relay set (highest-stakes item: encrypted DM path, 05-06)"
    why_human: "Encrypted send path, needs live relays"
  - test: "Notifications index at zero count (WR-01): open /notifications with a time range that yields zero for some category"
    expected: "Zero-count rows should look as before (no extra 8px gap). Currently expected to FAIL; fix first, then confirm"
    why_human: "Visual layout"
---

# Phase 5: Refactor oversized files, long functions, and duplicated blocks - Verification Report

**Phase Goal:** The handful of files and functions that have outgrown themselves are split along real seams and their duplicated blocks are factored out, with each thin wrapper either inlined or justified, so the remaining complexity findings reflect deliberate structure.
**Verified:** 2026-10-01
**Status:** human_needed
**Re-verification:** No, initial verification

ROADMAP lists no formal Success Criteria and no requirement IDs, so must-haves are derived from the goal plus the CONTEXT decisions D-01..D-19 (Option C).

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every bucket-H finding is fixed or behind a rule-scoped ignore with a reason (D-01, D-19). Live count is 0 | VERIFIED | I ran `pnpm exec aislop scan --json .` myself on HEAD: 664 diagnostics (SUMMARY says 694 to 664), score 85, and `jq` over the four bucket-H rules returns 0. There are 9 `aislop-ignore-*` directives, all rule-scoped with `-- reason` (torrents.ts, list-history-modal, groups/index, code.tsx, youtube.tsx, about.tsx, poll-form.tsx, event-publisher/index.tsx, verify-event.ts). `.aislop/config.yml` was not touched by this phase |
| 2 | `napplet-shell-provider.tsx` split into `services/napplet-shell/*` plus a thin provider, modals moved to `components/napplets/` (D-08, D-09) | VERIFIED | Provider is 198 lines (was 1162). Modules exist: `adapter.ts` 243, `common-actions.ts` 204, `intent-service.ts` 146, `permissions.ts` 79, `relay-tiers.ts` 17, `resource-service.ts` 264, `upload-service.ts` 62. `consent-modal.tsx` and `intent-choice-modal.tsx` are in `components/napplets/` and imported by the provider. Only 3 consumer import sites, unchanged. Permission state has one owner (`permissions.ts`) and the map is not exported. D-11 respected: the sibling services were not moved |
| 3 | `services/wallets.ts` became `services/wallets/{types,webln,nwc,nutwallet,index}.ts` with zero consumer churn (D-10) | VERIFIED | `src/services/wallets.ts` is gone. The directory has all five files, the largest 289 lines. `index.ts` re-exports the types, `WALLET_TYPE_LABELS` and `hasWebln`. The 12 bare `services/wallets` import sites are unchanged and `tsc --noEmit` exits 0 |
| 4 | Long functions are split by kind (D-12): `useWebxdc`, `renderBody`, `handleRequest` extracted; the three page components ignored with a reason | VERIFIED (structure) | `use-webxdc.ts` now has `useWebxdcCollectedUpdates`, `useWebxdcStateUpdates`, `useWebxdcRealtimeChannel` plus a composing `useWebxdc`. `post-modal/index.tsx` has `PublishedEntryBody`, `MiningBody`, `ComposerBody` and `PostModalInner`. The three page components carry next-line ignores citing D-12. Rescan shows 0 `function-too-long` |
| 5 | The clear duplicate-block wins are extracted (D-05, D-07) and the borderline ones ignored with a reason | VERIFIED | `magic-textarea.tsx` shares `createAutocompleteProps` between `MagicInput` and `MagicTextArea`. `error-logger.ts` has a shared `renderErrorLogGroup`. `NotificationCountBadge` and the voice sliders are factored. Cached-files and service-worker cards use `useAsyncAction`. The code.tsx, youtube.tsx, groups and list-history-modal files carry reasoned ignores. The torrents.ts file-level ignore matches D-06 |
| 6 | Dead code in `relay-stats.ts` is deleted, which disposes of the `getRTTTag` bug (D-13); `verifyEvent` is kept behind a late-binding justification (D-14) | VERIFIED | Repo-wide grep of `src/` for `getRelayURL`, `getRTT`, `getRTTTag`, `MONITOR_METADATA_KIND` returns nothing. The `verifyEvent` ignore states the runtime strategy swap. Its consumer list is stale (IN-01), so it is a WARNING, not a failure |
| 7 | Vitest is added, scoped to the pure functions this phase creates (D-15), with a `test` script | VERIFIED | `package.json` has `"test": "vitest run"` and `vitest` pinned exactly at `5.0.1`. `.planning/config.json` `test_command` is `pnpm test`. There are two test files only: `permissions.test.ts` and `nwc.test.ts`. I ran `pnpm test`: 2 files, 17 tests passed. `tsc --noEmit` exit 0 |
| 8 | Refactors preserve behaviour: moves are move-only commits (D-16) and nothing regresses | PARTIAL / BEHAVIOR_UNVERIFIED | D-16 is evidenced by separate `refactor(05-09..12)` move commits and `docs` commits. The reviewer diffed the two big moves function by function and found them faithful. But two behaviour changes were introduced (WR-01, WR-02, below), and most relocated runtime behaviour has no test. See human_verification |

**Score:** 7/8 truths verified (1 present, behaviour-unverified). The fully-verified count excludes truth 8.

### Deferred Items

None.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/services/napplet-shell/*.ts` (7 modules) | Adapter modules | VERIFIED | Substantive and wired. Provider imports `createAdapter`, permissions and the upload type. Adapter composes the others |
| `src/components/napplets/{consent,intent-choice}-modal.tsx` | Moved modals | VERIFIED | Imported by the provider |
| `src/services/wallets/*.ts` | Backend split | VERIFIED | Barrel preserves the public API |
| `src/services/napplet-shell/permissions.test.ts`, `src/services/wallets/nwc.test.ts` | Pure-function tests | VERIFIED | Run and pass (17 tests) |
| `.planning/ROADMAP.md` Phase 5 entry | D-04 correction | VERIFIED | Names the real targets; says torrents is an ignore, `relay-stats` is dead code, provider is 1162 lines |
| `05-BASELINE.md` before/after table and ignore inventory | D-19 | VERIFIED | Table reconciles with my live scan (0) |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `providers/global/napplet-shell-provider.tsx` | `services/napplet-shell/adapter`, `permissions` | named imports | WIRED |
| Provider | consent and intent-choice modals | JSX render | WIRED |
| `services/wallets/nwc.ts` | `./webln` (`abortError`) | named import | WIRED, but misplaced (WR-03) |
| `services/event-store.ts`, `napplet-shell/adapter.ts` | `services/verify-event` | named import | WIRED |
| 12 wallet consumers | `services/wallets` | bare directory path | WIRED (tsc passes) |

### Data-Flow Trace (Level 4)

Not applicable beyond the wiring above. This was a relocation and extraction phase with no new data sources.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Bucket-H rescan | `pnpm exec aislop scan --json .` then `jq` over the four rules | 0 findings, 664 total, score 85 | PASS |
| Unit tests | `pnpm test` | 2 files / 17 tests passed | PASS |
| Type-check | `tsc --noEmit --project tsconfig.json` | exit 0 | PASS |
| `pnpm build` | Not re-run by me | The orchestrator reports exit 0 on HEAD | PASS (reported) |

### Probe Execution

Step 7c: SKIPPED. The phase declares no probes.

### Requirements Coverage

No requirement IDs (`requirements: []`) and no REQUIREMENTS.md mapping, so there is nothing to enforce and no orphans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/views/notifications/index.tsx` | 19-42, 80+ | `NotificationCountBadge` element passed to `metadata` is always truthy, so `SimpleNavBox` renders an empty `<Box>` at zero count (WR-01) | WARNING | Unintended layout change (extra 8px gap in zero-count rows). I confirmed this against `simple-nav-box.tsx:60` (`{metadata && <Box>{metadata}</Box>}`) and the original `count === 0 ? null : ...`. The 05-05 SUMMARY's "zero-count guard preserved" is misleading |
| `src/views/settings/background-worker/*-card.tsx` | 64-109, 38-71 | Per-action error toast titles and the production-build hint dropped by the `useAsyncAction` conversion (WR-02) | WARNING (accepted) | See classification below |
| `src/services/wallets/nwc.ts` | 8 | Imports `abortError` from `./webln` (WR-03) | WARNING | Layering smell, no runtime impact now |
| `src/services/verify-event.ts` | 32 | Ignore reason names `napplet-shell-provider.tsx` as a consumer; it is now `napplet-shell/adapter.ts` (IN-01) | WARNING | A stale reason is a maintainer trap and runs against D-08's justification bar |
| `src/services/napplet-shell/relay-tiers.ts` | 7-17 | New debug `log` call on every relay-tier lookup (IN-05) | INFO | New noise, behaviour addition |
| `src/hooks/use-webxdc.ts` | 122, 243 | `updates` returned but unused (IN-04) | INFO | Dead return value |
| Several files | -- | Refactor-history comments (IN-03); 4 files not Prettier-clean (IN-02); `adapter.ts` takes a Chakra `useToast` type (IN-06) | INFO | Cosmetic |
| `resource-service.ts` 213, `common-actions.ts` 100 | -- | Pre-existing: `resource.cancel` cannot cancel `bytesMany` items; unused `label` param (IN-07, IN-08) | INFO | Pre-existing, relocated unchanged. These are not logged in the D-18 ledger, which says nothing was promoted. Recommend recording them in the backlog |

No `TBD`/`FIXME`/`XXX` debt-marker blockers were introduced in the reviewed files.

### Classification of the review warnings against CONTEXT

- **WR-01 (notification badge)**: not authorised by any decision. D-05 called for extracting the repeated block, and D-16 and the phase framing call for behaviour-preserving moves. The change is real and unintended, and the 05-05 summary claimed the guard was preserved. It is a cosmetic, low-severity layout regression, so it does not defeat the phase goal (complexity findings reflect deliberate structure). I classify it as a **non-blocking WARNING that should be fixed before shipping**. The reviewer's `renderCountBadge` fix is about five lines. If you want zero tolerance for unintended behaviour change, treat it as a gap and run `/gsd-plan-phase --gaps`.
- **WR-02 (error toasts)**: D-07 explicitly states "`useAsyncAction` toasts `e.message` and manages `loading`", which anticipates the generic toast, and AGENTS.md mandates the hook. So the conversion itself is an **intended, accepted behaviour change** (advisory). The review is still right that the "built for production" hint was a useful diagnostic and that the summaries did not call out the loss. Optionally rethrow with a descriptive message, or record it as accepted.
- **WR-03**: advisory layering issue, easy fix, no goal impact.

### Human Verification Required

See the frontmatter `human_verification` list. It consolidates the OUTSTANDING items carried by 05-04 to 05-12. Those items genuinely need a human or a live relay, wallet or mini-app: modal UI, effect cleanup, encrypted DM send, wallet backends. Context records that long `pnpm dev` sessions have previously been killed by OOM, so keep the pass short and targeted. The highest-value items are the napplet consent flow (security-sensitive), the DM send in both NIP-17 and NIP-04, and PoW mid-mine dismissal.

### Gaps Summary

No must-have truth is FAILED. The phase goal is achieved by the evidence I measured myself: a live scan shows 0 bucket-H findings, 20 of them fixed in code and 13 behind nine reasoned, rule-scoped ignores. The 1162-line provider and the 591-line wallets file are genuinely split along the seams CONTEXT named. The test harness exists and passes, and `tsc` is clean.

What stops this being `passed`:
1. Almost all relocated runtime behaviour is untested and was never exercised, by the summaries' own admission. That is the human verification list.
2. WR-01 is a real unintended regression with a trivial fix.
3. IN-01 leaves one ignore reason stale, and IN-07 and IN-08 are real latent items not recorded in the D-18 ledger, which says nothing was promoted.

Recommended before shipping: fix WR-01, correct the IN-01 consumer list, and optionally move `abortError` (WR-03), drop the `relay-tiers` logs (IN-05) and the dead `updates` return (IN-04).

---

_Verified: 2026-10-01_
_Verifier: Claude (gsd-verifier)_
