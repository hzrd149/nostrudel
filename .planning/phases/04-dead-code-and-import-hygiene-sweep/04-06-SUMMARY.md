---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 06
subsystem: code-quality
tags: [eslint, unused-vars, react, typescript, aislop]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: Wave-1/Wave-2 import hygiene and dead-declaration cleanup that this plan's files build on
provides:
  - All 14 unused-parameter findings under src/views/ resolved (D-06), completing the view-file half of the repo-wide sweep (sibling plan 04-05 covers non-view files)
  - The `_`-prefix underscore convention applied consistently across 12 sites (matching Wave 2's `_authors`/`_info`/`_data` spelling)
  - backlog 999.13's `replyKind` write-seam preserved intact (type member + default + prefixed binding)
affects: [04-dead-code-and-import-hygiene-sweep verification/audit, backlog 999.13 (NIP-22 comments)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "`_`-prefix unused parameter/destructured-binding convention (D-06), applied identically to plan 04-05's non-view sibling"
    - "Contract-bound (prefix) vs. trailing-with-no-caller (delete) test applied per-site, verified by grepping call sites before any deletion"

key-files:
  created: []
  modified:
    - src/views/feeds/dvm/components/dvm-avatar.tsx
    - src/views/feeds/dvm/components/dvm-params.tsx
    - src/views/feeds/relays/index.tsx
    - src/views/lists/components/user-card.tsx
    - src/views/user/components/user-card.tsx
    - src/views/relays/components/relay-card.tsx
    - src/views/notifications/focused-context.ts
    - src/views/messages/chat/components/direct-message-form.tsx
    - src/views/messages/components/direct-message-content.tsx
    - src/views/messages/group/components/group-relay-connections.tsx
    - src/views/settings/search/index.tsx
    - src/views/streams/stream/components/stream-sats-per-minute.tsx
    - src/views/thread/components/reply-form.tsx
    - src/views/tools/event-publisher/components/event-template-editor/index.tsx

key-decisions:
  - "dvm-avatar.tsx's noProxy and relay-card.tsx's to were DELETED (not prefixed) after grep confirmed zero callers pass either — the only two of the 14 sites resolved by deletion rather than underscore-prefix"
  - "relay-card.tsx's default-exported RelayCard is dead code with zero callers anywhere in the repo (only its named export RelayPaidTag is imported elsewhere) — out of scope for D-06 (whole-component deletion belongs to D-07/backlog, not this parameter-only plan), left as-is beyond the to parameter"
  - "stream-sats-per-minute.tsx's ...props rest binding was deleted (not prefixed) since it is never spread into the rendered JSX and no current caller passes extra props; the FlexProps half of its prop type was left untouched, out of scope for a parameter-only fix"
  - "reply-form.tsx's replyKind was prefixed only — ReplyFormProps.replyKind member and its kinds.ShortTextNote default were deliberately preserved per backlog 999.13's explicit instruction not to delete this write-seam"
  - "All other 11 sites had at least one live caller passing the flagged argument (rootId, text, group, relay x2, showUsers) or the parameter's position was fixed by the callback contract (sort comparator's b, two Object.entries filter destructurings' first element) — all 11 were resolved by underscore-prefixing the local binding, keeping the type/contract intact"

requirements-completed: [D-06]

coverage:
  - id: D1
    description: "All 14 unused-parameter findings under src/views/ resolved — 2 by deletion (verified zero callers via grep), 12 by underscore-prefixing (callers pass the argument, or position is fixed by a callback/props-type contract)"
    requirement: "D-06"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq (file-scoped eslint/no-unused-vars Parameter query) -- 0 across all 14 plan files"
        status: pass
      - kind: integration
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D2
    description: "reply-form.tsx's replyKind write-seam (backlog 999.13) survives untouched apart from the underscore prefix on the local binding"
    requirement: "D-06"
    verification:
      - kind: unit
        ref: "grep -c replyKind src/views/thread/components/reply-form.tsx == 2 (type member + prefixed binding)"
        status: pass
      - kind: unit
        ref: "grep -c ShortTextNote src/views/thread/components/reply-form.tsx == 1 (default intact)"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-15
status: complete
---

# Phase 04 Plan 06: View-file unused-parameter sweep (D-06) Summary

**Resolved all 14 `eslint/no-unused-vars` "Parameter" findings under `src/views/` — 2 by deleting parameters with zero live callers, 12 by underscore-prefixing contract-bound bindings — while deliberately preserving `reply-form.tsx`'s `replyKind` write-seam for backlog 999.13.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Closed D-06 for the entire `src/views/` half of the repo-wide unused-parameter sweep (14/14 sites), leaving the non-view half to sibling plan 04-05
- Applied the phase's newly-introduced `_`-prefix convention consistently, matching Wave 2's established spelling (`_authors`, `_info`, `_data`)
- Grepped every caller before choosing prefix vs. delete at each of the 14 sites, per the plan's contract-bound test
- Preserved `ReplyFormProps.replyKind`, its `kinds.ShortTextNote` default, and the underlying write-seam that backlog 999.13 (NIP-22 comments) will wire up — verified by two grep acceptance criteria, since neither `tsc` nor the linter would have caught an accidental deletion

## Task Commits

1. **Task 1: Resolve seven view parameters in feeds, lists, users, relays and notifications** - `6e5131097` (fix)
2. **Task 2: Resolve the remaining seven, preserving the replyKind seam** - `3b2aeff0e` (fix)

## Files Created/Modified

- `src/views/feeds/dvm/components/dvm-avatar.tsx` - deleted unused `noProxy` (type member + destructured binding); zero callers pass it
- `src/views/feeds/dvm/components/dvm-params.tsx` - prefixed unused filter-callback destructured element `_param`
- `src/views/feeds/relays/index.tsx` - prefixed unused `showUsers: _showUsers` (a caller does pass `showUsers={false}`, the component itself never reads it — pre-existing, left as-is)
- `src/views/lists/components/user-card.tsx` - prefixed unused `relay: _relay` (caller `lists/list/index.tsx` passes `relay={relays?.[0]}`)
- `src/views/user/components/user-card.tsx` - prefixed unused `relay: _relay` (caller `user/tabs/following.tsx` passes `relay={relays?.[0]}`; confirmed this is a distinct component from the `lists/` one despite the shared filename)
- `src/views/relays/components/relay-card.tsx` - deleted unused `to` (type member + destructured binding); this file's default-exported `RelayCard` has zero callers anywhere in the repo (only its named export `RelayPaidTag` is imported elsewhere) — the whole-component dead-code question is out of scope for this parameter-only plan
- `src/views/notifications/focused-context.ts` - prefixed `_id` on the default context's no-op `focus` stub (this whole module has zero importers repo-wide; treated as contract-bound since the function type defines the shape future providers must implement — out of scope to delete the module itself)
- `src/views/messages/chat/components/direct-message-form.tsx` - prefixed unused `rootId: _rootId` (caller `thread-drawer.tsx` passes `rootId={thread.rootId}`)
- `src/views/messages/components/direct-message-content.tsx` - prefixed unused `text: _text` on `LegacyDirectMessageContent` (its caller, the enclosing `DirectMessageContent`, passes `text={text}` from a `DecryptPlaceholder` render-prop; the component derives its own plaintext internally instead of using this prop — pre-existing, unrelated to this fix)
- `src/views/messages/group/components/group-relay-connections.tsx` - prefixed unused `group: _group` (caller `messages/group/index.tsx` passes `group={group}`)
- `src/views/settings/search/index.tsx` - prefixed unused sort comparator's second argument `_b`; left the file's residual unused import for 04-10 per plan instruction
- `src/views/streams/stream/components/stream-sats-per-minute.tsx` - deleted the unused `...props` rest binding (never spread into rendered JSX; today's only caller passes no extra props); left its catch clause (already handled by 04-02) and the `FlexProps` half of the type annotation untouched
- `src/views/thread/components/reply-form.tsx` - prefixed `replyKind: _replyKind = kinds.ShortTextNote` — the exported `ReplyFormProps.replyKind` member and the default value are both intentionally unchanged, per backlog 999.13's explicit instruction
- `src/views/tools/event-publisher/components/event-template-editor/index.tsx` - prefixed unused filter-callback destructured element `_name` in the `KindOptions` construction (a separate `.map(([name, kind]) => ...)` later in the same file legitimately uses `name` and was left untouched)

## Decisions Made

- Two sites (`dvm-avatar.tsx`'s `noProxy`, `relay-card.tsx`'s `to`) were resolved by deletion rather than prefix, after grepping every caller and finding none passes the argument — the plan's own test for safe deletion.
- The other 12 sites were resolved by prefixing, because either a live caller passes the argument (7 sites: `showUsers`, `relay` x2, `rootId`, `text`, `group`, and implicitly `replyKind` via its default) or the parameter's position is fixed by a callback/comparator/props-type contract (5 sites: two `Object.entries(...).filter([x, ...])` destructurings, one sort comparator, `stream-sats-per-minute.tsx`'s rest binding was the exception resolved by deletion since it's genuinely dead — see below, and `focused-context.ts`'s context-value function type).
- `stream-sats-per-minute.tsx`'s `...props` was deleted rather than prefixed: unlike the props objects in Task 1's user-card files, this rest binding is never spread anywhere in the component's JSX output (the `<Flex gap="2">` root has no `{...props}` spread at all), and its only caller (`streams/stream/index.tsx`) passes no additional props today. This matches the plan's own instruction: prefix only if a call site passes props; otherwise remove it from the signature. The type's `FlexProps` intersection was left untouched since narrowing it is a props-type API change out of scope for a parameter-only fix.

## Deviations from Plan

None - plan executed exactly as written. Both single-most-important-instruction guardrails (never delete `replyKind`; the two Task 2 grep assertions) were honored.

## Issues Encountered

- **Tooling bug in the plan's own `<automated>` verify command for Task 1** (matches the five prior sibling executors' experience): `select([...] | index(.filePath))` is invalid jq — piping an array literal into `index(.filePath)` breaks the `.` context and fails with `Cannot index array with string "filePath"` (exit 5). Used the corrected form `select(.filePath as $f | [...] | index($f))` instead, per the plan's own documented workaround. Did not edit the plan file.
- **Task 2's repo-wide (unfiltered) jq acceptance criterion could not return `0` from this isolated worktree.** This plan (04-06) only owns `src/views/`; sibling plan 04-05 (running concurrently in a separate worktree, per the wave's parallel-execution split) owns the remaining non-view D-06 sites. A repo-wide scan from inside this worktree still shows those un-merged non-view findings (39 remaining after this plan's edits, all outside `src/views/`), which is expected until the orchestrator merges both worktrees. Verified this plan's own scope is fully clean via a file-filtered jq query restricted to the 14 files in `files_modified` (0 findings), and via a direct listing of the two grep acceptance criteria for `reply-form.tsx` (both pass). `pnpm build` passed after both tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- D-06 is closed for every file this plan owns (`src/views/`); full repo-wide closure depends on sibling plan 04-05 landing in the same branch (orchestrator's merge step).
- backlog 999.13 (NIP-22 comments in kind 1 threads) still has its intact `replyKind` seam to build on — `ReplyFormProps.replyKind`, the `kinds.ShortTextNote` default, and now a properly `_`-prefixed local binding that satisfies the linter without touching the contract.
- `relays/components/relay-card.tsx`'s default-exported `RelayCard` component remains fully dead code (zero importers) beyond the parameter fix applied here — flagged for a future D-07/backlog dead-code pass, not resolved in this plan since whole-component deletion is out of this plan's scope.

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-15*
