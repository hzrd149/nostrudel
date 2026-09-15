---
phase: 03-audit-swallowed-exceptions-and-silent-failure-paths
plan: 01
subsystem: error-handling
tags: [aislop, swallowed-exception, encrypted-storage, decryption-cache, dms, blossom]

# Dependency graph
requires:
  - phase: 02-adopt-aislop-linter
    provides: aislop 0.16.1 pinned, .aislop/config.yml rule policy, lint:ci gate
provides:
  - Zero error-severity ai-slop/swallowed-exception and ai-slop/silent-recovery findings across the five decryption/signer sites named in D-02 Wave 1
  - Whole-repo bucket-B error count reduced from 31 to 25
  - Module-scope logger.extend() namespaces "EncryptedStorage", "DecryptionCache", "BlobRepair" as the D-12 pattern's third/fourth/fifth in-repo instances
affects: [03-02, 03-03, 03-04, 03-05, 03-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-05/D-10/D-12 remedy: reason comment + logger.extend(\"<Name>\") call + explicit control-flow statement (return/continue) clears ai-slop/swallowed-exception without changing behavior"
    - "D-11: delete a try/catch entirely when it wraps a call that structurally cannot reject (verified via the wrapped function's own contract, not assumed)"

key-files:
  created: []
  modified:
    - src/classes/encrypted-storage.tsx
    - src/services/decryption-cache.ts
    - src/helpers/nostr/dms.ts
    - src/views/messages/chat/components/decrypt-placeholder.tsx
    - src/components/blob-details-modal.tsx

key-decisions:
  - "encrypted-storage.tsx unlock() catch logs the caught error and returns false explicitly, reproducing the pre-existing fall-through for all three callers without distinguishing wrong-PIN from corrupt-storage (that split is an explicitly deferred security item, T-03-02)"
  - "decryption-cache.ts sampling loop catch logs and continues sampling with no early exit, since it is a best-effort size estimator and the raw localforage record was never decrypted at this call site"
  - "dms.ts groupIntoConversations catch uses the bare `catch {` form (D-06) since the binding was unused, plus a reason comment and explicit continue; the function was left in place (undecided dead-code status is a Phase 4 concern, not this plan's)"
  - "decrypt-placeholder.tsx's try/catch around unlock() was deleted rather than logged, because useLegacyMessagePlaintext never rethrows (it captures failure into its own error state) — the catch was unreachable dead code, not a real swallow"
  - "blob-details-modal.tsx's two per-attempt catches (direct fetch, per-server download) both log their cause and fall through unchanged; the terminal throw and the useAsyncAction wrapper that surfaces it were left untouched per D-10"

patterns-established:
  - "Third file confirming the D-12 convention: module-scope `const log = logger.extend(\"<Name>\")` placed after imports, one namespace per file, private (not exported)"

requirements-completed: [D-01, D-02, D-05, D-06, D-08, D-10, D-11, D-12]

coverage:
  - id: D1
    description: "encrypted-storage.tsx unlock() catch logs the caught error and explicitly returns false; zero bucket-B error findings in the file"
    requirement: "D-02"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter on src/classes/encrypted-storage.tsx for ai-slop/swallowed-exception|ai-slop/silent-recovery error severity"
        status: pass
    human_judgment: false
  - id: D2
    description: "decryption-cache.ts sampling loop logs unreadable entries and keeps sampling; post-loop size scaling still reachable"
    requirement: "D-02"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter on src/services/decryption-cache.ts; grep -c 'estimatedSize = Math.round' == 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "dms.ts groupIntoConversations skips unparseable messages via explicit continue instead of a silent empty catch"
    requirement: "D-02"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter on src/helpers/nostr/dms.ts; grep -c 'continue' >= 1; grep -c 'return Object.values(conversations)' == 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "decrypt-placeholder.tsx's unreachable try/catch around unlock() is removed; the hook's existing error Alert branch is unchanged and still renders on failure"
    requirement: "D-02"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter on decrypt-placeholder.tsx; grep -c 'catch' == 0; grep -c 'error.message' == 1"
        status: pass
    human_judgment: true
    rationale: "Confirming the Alert actually renders on a real legacy-DM decrypt failure requires provoking that failure live; D-04 explicitly rejected a UAT wave for this plan. pnpm build plus the source assertion (unlock() awaited plain, error.message still rendered) is the accepted substitute per 03-VALIDATION.md."
  - id: D5
    description: "blob-details-modal.tsx's two per-attempt repair catches (direct fetch, per-server download) log their cause; loop short-circuit and terminal throw unchanged"
    requirement: "D-02"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq filter on blob-details-modal.tsx; grep -c 'if (blob) break;' == 1; grep -c 'Failed to download blob from any server' == 1"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min
completed: 2026-09-15
status: complete
---

# Phase 3 Plan 1: Wave-1 decryption/signer swallowed-exception fixes Summary

**Five decryption/signer sites (EncryptedStorage.unlock, decryption-cache sampling loop, DM conversation grouping, legacy-DM decrypt placeholder, blob repair fallback) now log or explicitly control-flow every previously discarded error, dropping the whole-repo bucket-B error count from 31 to 25 with zero behavior change.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-09-15T14:11:08Z
- **Tasks:** 3 completed
- **Files modified:** 5

## Accomplishments
- `EncryptedStorage.unlock()` no longer silently discards the caught decrypt error — it's logged under `logger.extend("EncryptedStorage")` and the method returns `false` explicitly, matching the prior fall-through for all three callers
- `decryptionCacheStats$`'s sampling loop logs unreadable cache entries (`logger.extend("DecryptionCache")`) instead of a bare comment-only catch, and still samples every remaining key
- `groupIntoConversations` in `dms.ts` skips a message with no `p` tag via an explicit `continue` inside a bare `catch {}`, with a reason comment; the function itself (currently uncalled — `groupMessages` is what every view actually imports) was left untouched
- The unreachable `try/catch` wrapping `unlock()` in `decrypt-placeholder.tsx` was deleted outright, since `useLegacyMessagePlaintext` never rethrows and already renders its own error state
- Both per-attempt catches in `RepairBlobButton`'s repair handler (direct URL fetch, per-server blossom download) now log their cause via `logger.extend("BlobRepair")`; the loop's `if (blob) break;` short-circuit and the terminal `throw new Error("Failed to download blob from any server")` are byte-for-byte unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Cache unlock and cache-size sampling — reason comment, namespaced log, explicit return** - `a090b804d` (fix)
2. **Task 2: DM conversation skip guard and the unreachable decrypt catch** - `c213e3a05` (fix)
3. **Task 3: Blob repair per-attempt failures logged with their cause** - `8871a3832` (fix)

_Note: no plan-metadata commit is listed here yet — it follows this SUMMARY.md write._

## Files Created/Modified
- `src/classes/encrypted-storage.tsx` - `unlock()` catch logs the caught error and returns `false` explicitly; new module-scope `logger.extend("EncryptedStorage")`
- `src/services/decryption-cache.ts` - `decryptionCacheStats$` sampling-loop catch logs unreadable raw records and keeps sampling; new module-scope `logger.extend("DecryptionCache")`
- `src/helpers/nostr/dms.ts` - `groupIntoConversations` catch is now `catch { continue; }` with a reason comment
- `src/views/messages/chat/components/decrypt-placeholder.tsx` - unreachable `try/catch` around `await unlock()` removed; hook's `error` state and Alert branch untouched
- `src/components/blob-details-modal.tsx` - both per-attempt repair catches log their cause via new module-scope `logger.extend("BlobRepair")`

## Decisions Made
- `encrypted-storage.tsx`: log-then-return-false in the `unlock()` catch, no distinction between wrong-PIN and corrupt-storage (that remains T-03-02, an accepted pre-existing risk deferred as a separate security item, not this plan's scope)
- `decryption-cache.ts`: no early exit added inside the catch — this is a best-effort size estimator and must keep sampling remaining keys; the post-loop `estimatedSize = Math.round(...)` scaling stays reachable
- `dms.ts`: used the bare `catch {` form (D-06, unused binding) rather than naming an unused `e`; left `groupIntoConversations` in place since it currently has zero callers and its dead-code status is Phase 4's call, not this plan's
- `decrypt-placeholder.tsx`: chose deletion over logging for this catch specifically because `unlock()` cannot reject (verified against `useLegacyMessagePlaintext`'s own contract) — this is D-11's "unreachable catch" remedy, distinct from D-05/D-10's log-or-return remedy used everywhere else in this plan
- `blob-details-modal.tsx`: kept the `useAsyncAction` wrapper as the single surfacing layer (D-10); did not restructure the terminal throw to carry a specific attempt's cause, since the new per-attempt logs already capture that without changing the terminal error's message

## Deviations from Plan

None - plan executed exactly as written. All five files, their catch remedies, and the reason-comment/log/control-flow triad matched what the plan specified per file.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave-1 (Plan 01) of the D-02 risk-first ordering is complete; whole-repo bucket-B error count is now 25, ready for Plan 03-06's before/after report
- Plans 03-02 through 03-05 (remaining waves) are unblocked to proceed on their own file sets
- No new attack surface introduced (confirmed via this plan's `threat_model`); the three new namespaced loggers are `debug`-package based and silent by default in production

---
*Phase: 03-audit-swallowed-exceptions-and-silent-failure-paths*
*Completed: 2026-09-15*

## Self-Check: PASSED

All 5 modified files and this SUMMARY.md confirmed present on disk. All 3 task commit hashes (`a090b804d`, `c213e3a05`, `8871a3832`) confirmed present in `git log --oneline --all`.
