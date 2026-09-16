---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 03
subsystem: code-quality
tags: [dead-code, d-07, aislop, typescript, react-hooks]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: 04-01's import merge in src/services/wallets.ts (this plan deletes disjoint lines 33-34 in the same file, sequenced after that merge)
provides:
  - Four never-referenced functions deleted (RepairBlobButton, isDirectReply, Header, ListFeedButton)
  - Two unwired wallet config constants deleted (SUGGESTED_MINTS, DEFAULT_WALLET_RELAYS)
  - Four judgment-call dead bindings resolved per-site without removing live code (useState setter, two dead hook-return-values, one dead useState + orphaned import)
affects: [04-04, 04-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-site judgment for unused hook-return-value bindings: verify no other reader exists in the component before deleting the whole hook call, never batch-delete by rule name alone"

key-files:
  created: []
  modified:
    - src/components/blob-details-modal.tsx
    - src/services/notifications/threads.ts
    - src/views/pictures/picture/index.tsx
    - src/views/lists/list/follow-set.tsx
    - src/services/wallets.ts
    - src/views/feeds/dvm/feed.tsx
    - src/views/messages/index.tsx
    - src/views/messages/group/index.tsx
    - src/views/user/tabs/lists.tsx

key-decisions:
  - "messages/index.tsx: deleted the autoDecryptMessages use$ call but kept the locked binding on the next line, correcting 04-RESEARCH.md's claim that both were dead - locked is read at locked.length in the Inbox button label"
  - "messages/group/index.tsx: deleted this file's locked/GiftWrapsModel statement entirely after confirming by grep it has no reader anywhere in the component, unlike the same-named live binding in messages/index.tsx"
  - "feeds/dvm/feed.tsx: elided only the useState setter slot (setParams), keeping the single-element destructuring so params stays live for Object.entries(params) at line 83"
  - "user/tabs/lists.tsx: deleted the muted/useUserMutes statement; left the commented-out ListTypeCard consumer untouched (backlog 999.8, not this phase's scope)"

patterns-established: []

requirements-completed: [D-07]

coverage:
  - id: D1
    description: "Four never-referenced functions (RepairBlobButton, isDirectReply, Header, ListFeedButton) deleted with all orphaned imports removed in the same edit"
    requirement: "D-07"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq '.diagnostics[]|select(rule==eslint/no-unused-vars and message tests ^Function)' -> 0"
        status: pass
      - kind: other
        ref: "pnpm build (tsc typecheck)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Two unwired wallet config constants (SUGGESTED_MINTS, DEFAULT_WALLET_RELAYS) deleted from src/services/wallets.ts; the file's 6 narrative-comment banners and 04-01's import merge survive untouched"
    requirement: "D-07"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq 'wallets.ts unused-vars count' -> 0; 'wallets.ts narrative-comment count' -> 6"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D3
    description: "useState tuple in feeds/dvm/feed.tsx: only the dead setParams setter slot removed, live params reader untouched"
    requirement: "D-07"
    verification:
      - kind: unit
        ref: "grep -c 'Object.entries(params)' src/views/feeds/dvm/feed.tsx -> 1"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D4
    description: "Three unused hook-return-value bindings resolved per-site: messages/index.tsx's autoDecryptMessages deleted while its sibling locked binding stays live; messages/group/index.tsx's locked deleted entirely (confirmed no reader); user/tabs/lists.tsx's muted and its useUserMutes import deleted"
    requirement: "D-07"
    verification:
      - kind: unit
        ref: "grep -c 'locked.length' src/views/messages/index.tsx -> 1 (nonzero, live binding survived)"
        status: pass
      - kind: unit
        ref: "corrected jq (see Deviations) confirming 0 eslint/no-unused-vars Variable findings across the four Task 2 files"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-09-16
status: complete
---

# Phase 04 Plan 03: Judgment-Call Dead Code Deletions Summary

**Ten dead declarations removed across nine files — four never-referenced functions, two unwired wallet config constants, and four bindings requiring per-site judgment to avoid deleting live code alongside them (D-07).**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-16T00:07:25Z
- **Completed:** 2026-09-16T00:15:57Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Deleted four never-referenced functions after re-grepping each symbol immediately before deletion: `RepairBlobButton` (blob-details-modal.tsx), `isDirectReply` (notifications/threads.ts — the one remaining hit was inside a commented-out line, confirming dead rather than renamed), `Header` (pictures/picture/index.tsx), `ListFeedButton` (lists/list/follow-set.tsx)
- Deleted `SUGGESTED_MINTS` and `DEFAULT_WALLET_RELAYS` from `src/services/wallets.ts` along with the comment describing only them; the file's six narrative-comment banners and 04-01's earlier import merge were left untouched
- Removed every import orphaned by the above deletions (useToast, useActiveAccount, mergeBlossomServers, logger/log, useAsyncAction, createUploadAuth, multiServerUpload, downloadBlob, Button, ButtonProps in blob-details-modal.tsx; isAddressPointer, isEventPointer in threads.ts; five UI-component imports in pictures/picture/index.tsx; ButtonProps in follow-set.tsx)
- Resolved the four bindings that a mechanical "delete the statement" reading would have broken: elided only the dead setter slot of a `useState` tuple (feed.tsx), deleted a dead `use$` subscription while preserving the live `locked` sibling binding (messages/index.tsx — correcting a factual error in 04-RESEARCH.md), deleted a genuinely-unused `locked`/`GiftWrapsModel` call after confirming no reader exists (messages/group/index.tsx), and deleted a dead `muted`/`useUserMutes` pair while leaving its commented-out consumer alone (user/tabs/lists.tsx)

## Task Commits

1. **Task 1: Delete the four dead functions and the two unwired wallet constants** - `d1ebe4fa2` (feat)
2. **Task 2: Resolve the four bindings whose deletion could remove live code** - `55919c897` (fix)

_Note: this SUMMARY commit and the plan metadata commit follow separately per the worktree wave protocol._

## Files Created/Modified

- `src/components/blob-details-modal.tsx` - Deleted `RepairBlobButton` and its 10 now-orphaned imports/const
- `src/services/notifications/threads.ts` - Deleted `isDirectReply` and its 2 orphaned type-guard imports
- `src/views/pictures/picture/index.tsx` - Deleted `Header` and its 5 orphaned imports
- `src/views/lists/list/follow-set.tsx` - Deleted `ListFeedButton` and its orphaned `ButtonProps` import
- `src/services/wallets.ts` - Deleted `SUGGESTED_MINTS` and `DEFAULT_WALLET_RELAYS` plus their describing comment
- `src/views/feeds/dvm/feed.tsx` - Elided the dead `setParams` setter slot from the `useState` tuple
- `src/views/messages/index.tsx` - Deleted the dead `autoDecryptMessages` statement and its orphaned `localSettings` import; kept the live `locked` binding
- `src/views/messages/group/index.tsx` - Deleted the dead `locked`/`useEventModel(GiftWrapsModel, ...)` statement and the now-orphaned `GiftWrapsModel` import
- `src/views/user/tabs/lists.tsx` - Deleted the dead `muted` statement and its orphaned `useUserMutes` import

## Decisions Made

- `messages/index.tsx`'s `autoDecryptMessages` binding was confirmed safe to delete as a whole statement: grep shows the real auto-decrypt path is `autoDecryptMessagesFallback` in `src/services/decryption-cache.ts`, which reads `localSettings.autoDecryptMessages.value` directly and is wired independently. The `use$` subscription being deleted here had no side effect beyond the unused binding.
- `messages/group/index.tsx`'s `locked` binding (from `useEventModel(GiftWrapsModel, [account.pubkey, true])`) was confirmed by grep to have zero readers anywhere in the file — `useEventModel` is a reactive EventStore query with no independent side effect, so deleting the whole call was safe. This is the same shape as `messages/index.tsx`'s dead binding but a different, unrelated instance.
- `feeds/dvm/feed.tsx`'s `params` half of the `useState` tuple is read at `Object.entries(params)` a few lines below its declaration — only the `setParams` slot was elided, keeping the reader intact and typecheck-covered.
- `user/tabs/lists.tsx`'s `muted` binding's only consumer is a commented-out `ListTypeCard` line; that comment was left exactly as-is since it is pre-existing content assigned to backlog 999.8, not this phase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's Task 2 automated verify command had a jq scoping bug**
- **Found during:** Task 2 verification
- **Issue:** The plan's `<automated>` verify command for Task 2 was `select(["file1","file2",...]|index(.filePath))`. In jq, piping a literal array into `index(.filePath)` re-scopes `.` to the array itself before `.filePath` is evaluated, so `.filePath` tries to index an array with a string and the command errors out (`jq: error: Cannot index array with string "filePath"`, exit 5) rather than returning a count.
- **Fix:** Ran a corrected equivalent that binds `.filePath` to `$f` before the array lookup: `select(.filePath as $f | ["file1","file2",...] | index($f))`. This is semantically identical to the plan's stated acceptance criterion (0 `eslint/no-unused-vars` `Variable` findings across the four Task 2 files) and confirmed the same result the plan's command was meant to produce.
- **Files modified:** None (verification-only; no source change)
- **Verification:** Corrected command ran cleanly and returned `0`, matching the acceptance criterion
- **Committed in:** N/A (no source change; documented here for traceability)

---

**Total deviations:** 1 auto-fixed (1 bug, in plan tooling, not source code)
**Impact on plan:** No scope creep — the underlying acceptance criterion (zero unused-vars findings in the four Task 2 files) was still verified, just via a corrected jq invocation. Every other verify command in the plan ran as written.

## Issues Encountered

None beyond the jq deviation documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All ten D-07 judgment-site declarations from this plan's scope are gone; `pnpm build` passes after both tasks
- 04-04 (the plain-dead-locals half of D-07) and 04-10 (import hygiene) can proceed independently — this plan touched a disjoint set of files/lines from both
- `src/services/wallets.ts` is now clean of both 04-01's import-merge concerns and this plan's constant deletions; no further D-03/D-07 work remains in that file

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-16*
