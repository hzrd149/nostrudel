---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 02
subsystem: error-handling
tags: [aislop, eslint, catch-binding, swallowed-exception, lint-hygiene]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: "04-01's import-hygiene sweep (files_modified line numbers assumed post-04-01 state)"
provides:
  - "All 24 catch clauses with an unread caught binding converted to the bare `catch {` form, closing D-05 repo-wide"
affects: [04-05, 04-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bare `catch {` for unread caught bindings — extends the shape Phase 3 established (src/helpers/nip19.ts, src/helpers/parse.ts, src/helpers/nostr/goal.ts) to 24 additional sites, with catch bodies left byte-for-byte unchanged"

key-files:
  created: []
  modified:
    - src/classes/encrypted-storage.tsx
    - src/helpers/lightning.ts
    - src/helpers/lnurl.ts
    - src/helpers/nostr/event.ts
    - src/helpers/nostr/torrents.ts
    - src/helpers/nostr/zaps.ts
    - src/services/event-cache/native-sqlite.ts
    - src/services/notifications/zaps.ts
    - src/services/relay-info.ts
    - src/components/app-handler-modal/index.tsx
    - src/components/content/links/nostr.tsx
    - src/providers/route/delete-event-provider.tsx
    - src/views/channels/components/channel-message-block.tsx
    - src/views/groups/components/group-message-group.tsx
    - src/views/messages/components/direct-message-group.tsx
    - src/views/settings/accounts/components/password-signer-backup.tsx
    - src/views/settings/media-servers/index.tsx
    - src/views/settings/privacy/index.tsx
    - src/views/settings/profile/components/profile-edit-form.tsx
    - src/views/streams/stream/components/stream-sats-per-minute.tsx
    - src/views/wallet/components/receive-token-modal.tsx

key-decisions:
  - "All 24 sites needed only the binding removed — no catch body was empty or comment-only in a way requiring AGENTS.md's parse-guard shape (the one exception in the plan's Task 1 action never triggered)"
  - "src/helpers/nostr/zaps.ts's catch body is a bare `/*-*/` comment with a `return null;` after the try/catch closes (not inside the catch) — this shape already read 0 for both eslint/no-empty and ai-slop/swallowed-exception before this plan, and removing only the `err` binding left that unchanged"
  - "src/services/event-cache/native-sqlite.ts line 197's inner `catch (err)` was genuinely dead (shadowed by the outer `error` binding the body actually logs and rethrows) — confirmed by reading the body before editing, per the plan's Task 1 caution"
  - "src/views/settings/accounts/components/password-signer-backup.tsx has two catch clauses; only line 40's `error` was unread (line 47's `error` is read via `error instanceof Error`) — left line 47 untouched, matching the plan's measured-facts table exactly"

patterns-established:
  - "Bare `catch {` for a caught binding a catch body never reads (D-05), now the exclusive form used at all 24 repo-wide sites plus the 13 from Phase 3"

requirements-completed: [D-05]

coverage:
  - id: D1
    description: "10 catch clauses in helpers, classes and services (9 files) converted to bare catch, unread bindings removed, bodies unchanged"
    requirement: "D-05"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq caught-but-never-used filter over the 9 files -> 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq ai-slop/swallowed-exception count -> 0"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D2
    description: "3 catch clauses in components/providers converted to bare catch; inherited react-hooks/rules-of-hooks errors in app-handler-modal/index.tsx (backlog 999.2) left untouched"
    requirement: "D-05"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq caught-but-never-used filter over the 3 files -> 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq react-hooks/rules-of-hooks count for app-handler-modal/index.tsx -> 3 (unchanged)"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D3
    description: "11 catch clauses across 9 view files converted to bare catch, closing D-05 repo-wide (0 unused catch bindings remaining); 04-05's unused-parameter site and password-signer-backup.tsx's inherited hook-order errors left alone"
    requirement: "D-05"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq caught-but-never-used count repo-wide -> 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq ai-slop/swallowed-exception count repo-wide -> 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq Parameter-unused count on stream-sats-per-minute.tsx -> 1 (untouched, owned by 04-05)"
        status: pass
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-16
status: complete
---

# Phase 04 Plan 02: Bare `catch {` sweep across 24 unread-binding sites Summary

**24 catch clauses across 21 files converted from a discarded-but-declared binding (`e`/`error`/`err`) to the bare `catch {` form Phase 3 established, with every catch body left byte-for-byte unchanged.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-09-16T00:06:45Z
- **Completed:** 2026-09-16T00:17:54Z
- **Tasks:** 3
- **Files modified:** 21

## Accomplishments
- Closed D-05 repo-wide: the whole-repo `eslint/no-unused-vars` "caught but never used" count went from 24 to 0.
- `ai-slop/swallowed-exception` (error-severity, gates CI) confirmed still 0 at every severity after each task — Phase 3's bar is intact.
- `eslint/no-empty` confirmed still 0 (unchanged from the pre-task baseline) — no catch body was left literally empty.
- `pnpm build` passed after every task.

## Task Commits

Each task was committed atomically:

1. **Task 1: Bare catch in helpers, classes and services (10 sites, 9 files)** - `8ca08e2c2` (fix)
2. **Task 2: Bare catch in components and providers (3 sites, 3 files)** - `a43b4bee6` (fix)
3. **Task 3: Bare catch across views (11 sites, 9 files)** - `3b400dbc7` (fix)

_Note: This plan's tasks were `type="auto"`, not TDD; each commit is a single `fix(04-02): ...` commit per the task's scope._

## Files Created/Modified
- `src/classes/encrypted-storage.tsx` - Two decrypt-path catches (`e` at lines 126, 134) now bare; both still throw a specific error message.
- `src/helpers/lightning.ts` - Currency-formatting fallback catch (`error`) now bare; still returns the manual locale-formatted string.
- `src/helpers/lnurl.ts` - `isLNURL` guard catch (`e`) now bare; still returns `false`.
- `src/helpers/nostr/event.ts` - `isReply` guard catch (`error`) now bare; still returns `false`.
- `src/helpers/nostr/torrents.ts` - `validateTorrent` guard catch (`e`) now bare; still returns `false`.
- `src/helpers/nostr/zaps.ts` - LNURL-endpoint-fetch catch (`err`) now bare; body remains a bare `/*-*/` comment, function still falls through to `return null;` after the try/catch.
- `src/services/event-cache/native-sqlite.ts` - Inner cache-clear-retry catch (`err`) now bare; body is unchanged and still logs/rethrows the outer `error`.
- `src/services/notifications/zaps.ts` - Zap-validity filter catch (`error`) now bare; still returns `false`.
- `src/services/relay-info.ts` - NIP-11 fetch catch (`error`) now bare; still returns `null`.
- `src/components/app-handler-modal/index.tsx` - Profile-filter catch (`error`) now bare; still returns `false`. Inherited `react-hooks/rules-of-hooks` errors (3, backlog 999.2) untouched.
- `src/components/content/links/nostr.tsx` - nip19-decode-guard catch (`error`) now bare; still returns `null`.
- `src/providers/route/delete-event-provider.tsx` - Delete-publish catch (`e`) now bare; still calls `defer?.reject()`.
- `src/views/channels/components/channel-message-block.tsx` - Clipboard-copy catch (`error`) now bare; still shows the failure toast.
- `src/views/groups/components/group-message-group.tsx` - Clipboard-copy catch (`error`) now bare; still shows the failure toast.
- `src/views/messages/components/direct-message-group.tsx` - Clipboard-copy catch (`error`) now bare; still shows the failure toast.
- `src/views/settings/accounts/components/password-signer-backup.tsx` - Password-verify catch (`error`, line 40) now bare; still throws "Bad password". The outer catch (line 47, reads `error instanceof Error`) was left untouched — its binding is used. Inherited `react-hooks/rules-of-hooks` errors (2, backlog 999.2) untouched.
- `src/views/settings/media-servers/index.tsx` - Add-server catch (`error`) now bare; still shows the failure toast.
- `src/views/settings/privacy/index.tsx` - Both `validateInvidiousUrl` and `validateRequestProxy` guard catches (`e`, `e`) now bare; both still return the "Cant reach instance" string.
- `src/views/settings/profile/components/profile-edit-form.tsx` - Both lightning-address and NIP-05-identity validator catches (`error`, `error`) now bare; both still return their respective error strings.
- `src/views/streams/stream/components/stream-sats-per-minute.tsx` - webln-payment catch (`e`) now bare; still calls `setEnabled(false)`. The file's separate unused-parameter finding (owned by 04-05) was left untouched.
- `src/views/wallet/components/receive-token-modal.tsx` - Token-metadata-preview catch (`error`) now bare; still returns `undefined`.

## Decisions Made
- All 24 sites needed only the binding removed — none required AGENTS.md's parse-guard shape (reason comment + explicit exit) that the plan reserved for an empty/comment-only body, because every targeted body already had a real exit statement or (in one case) a pre-existing comment plus fallthrough control flow outside the catch.
- `src/helpers/nostr/zaps.ts`'s catch body (`/*-*/`) was read closely before editing since it looked like the plan's "comment-only" edge case; it was confirmed to already score 0 on both `eslint/no-empty` and `ai-slop/swallowed-exception` before this plan touched it (the function's `return null;` sits after the try/catch, not inside it), so removing only the `err` binding preserved that state exactly.
- `src/services/event-cache/native-sqlite.ts` line 197's `catch (err)` was confirmed dead-shadowed (its body logs and rethrows the outer `error`, not `err`) before converting it, per the plan's read-first caution.
- `src/views/settings/accounts/components/password-signer-backup.tsx` line 47's `catch (error)` was left untouched because its body reads `error instanceof Error` — only line 40 was in scope.

## Deviations from Plan

None - plan executed exactly as written. All 24 sites matched the plan's measured-facts table (small line-number drift from Phase 3/04-01 edits was expected and accounted for by locating each catch by content, not line number, per the plan's own instruction).

## Issues Encountered
- The plan's own verify `jq` command (`select(["file1","file2",...]|index(.filePath))`) has a scoping bug: piping an array literal into `index(.filePath)` evaluates `.filePath` against the array, not the diagnostic, and errors. Rewrote each verification as `select(.filePath as $f | [...]|index($f))` to get the intended per-file filter; the underlying data confirmed 0 in all three tasks either way once corrected.
- `pnpm exec aislop scan --json .` triggers a `pnpm install` lockfile-resolution pass on first invocation in a fresh worktree, printing non-JSON `pnpm` progress output to stdout ahead of the JSON payload on that first call; subsequent calls in the same session returned clean JSON. Not a regression, just a one-time environment warm-up.
- `pnpm lint:ci` (run once at the end for documentation purposes) reports 15 error-severity findings project-wide when scanned against `origin/next`'s merge-base, because `--changes` scores every file that differs from `next` across all of Phase 4's waves so far, not just this plan's files. Of those, only 5 fall inside this plan's touched files — the 3 `react-hooks/rules-of-hooks` errors in `app-handler-modal/index.tsx` and the 2 in `password-signer-backup.tsx`, both confirmed pre-existing and explicitly called out in the plan's measured-facts as backlog 999.2 / D-15, not this plan's responsibility. The remaining 10 errors are in files this plan never touched (`embed-event/link/index.tsx`, `use-user-bookmarks-list.ts`, `feeds/dvm/index.tsx`, `fallback-list-card.tsx`, `messages/group/index.tsx`) and belong to other Phase 4 waves/plans.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- D-05 is fully closed: 0 unused catch bindings remain anywhere in the repo.
- `04-05` can proceed independently — its unused-parameter site in `stream-sats-per-minute.tsx` was explicitly left untouched here.
- `04-11` (which enumerates the pre-existing `react-hooks/rules-of-hooks` findings as predating the phase) can rely on this plan's confirmation that `app-handler-modal/index.tsx` still reports exactly 3 and `password-signer-backup.tsx` still reports its 2, unchanged by this plan's edits.

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-16*
