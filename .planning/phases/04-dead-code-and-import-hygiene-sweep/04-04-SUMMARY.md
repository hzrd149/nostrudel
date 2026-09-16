---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 04
subsystem: dead-code-cleanup
tags: [eslint, aislop, dead-code, typescript, react]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: 04-01's import-hygiene auto-fix pass (this plan's sequencing depended on it landing first)
provides:
  - "13 plain dead local variables deleted across 12 files"
affects: [04-05, 04-10, 999.2, 999.9]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Underscore-prefix a destructured/assigned binding when the right-hand side call or destructuring has a
       load-bearing effect (cache warm, exclusion-via-rest) that must survive even though the binding itself
       is never read"

key-files:
  created: []
  modified:
    - src/components/note/note-menu.tsx
    - src/components/pow/miner.ts
    - src/components/timeline/highlight.tsx
    - src/services/outbox-subscriptions.ts
    - src/views/badges/badge-details.tsx
    - src/views/lists/components/fallback-list-card.tsx
    - src/views/napplets/napplet.tsx
    - src/views/relays/map/components/relay-details.tsx
    - src/views/relays/relay/tabs/about.tsx
    - src/views/search/components/search-results.tsx
    - src/views/settings/mailboxes/index.tsx
    - src/views/tools/event-console/user-autocomplete.ts

key-decisions:
  - "outbox-subscriptions.ts's `authors` destructure kept, renamed to `_authors` — removing it from the
     destructuring would silently re-include authors in filterWithoutAuthors, breaking the outbox-subscription
     contract; this is a destructuring-exclusion effect, not a plain unused binding"
  - "mailboxes/index.tsx's OutboxRelay `info` destructure kept, renamed to `_info` — useRelayInfo(url) performs
     a cached network fetch (relayInfoService.getInfo); dropping the call entirely would stop warming that
     cache for the outbox relay even though OutboxRelay never renders info-derived content"
  - "user-autocomplete.ts's `lookupPromise` declaration and its one assignment removed outright (not
     underscore-prefixed) since nothing anywhere reads the promise; the lookupUsers().then() call and its
     cachedUsers side effect are preserved as a fire-and-forget call"

patterns-established:
  - "Destructuring-exclusion (`const { key, ...rest } = obj`) and cache-warming hook calls are treated as
     'effect the surrounding code depends on' per Task 1's judgment rule, even though neither is a bare
     function call — the binding is underscore-prefixed rather than deleted"

requirements-completed: [D-07]

coverage:
  - id: D1
    description: "5 dead locals removed in components/services: note-menu.tsx `address`, miner.ts `bestHash`
      (declaration + reassignment), timeline/highlight.tsx `highlightText`/`context`, outbox-subscriptions.ts
      `authors` underscore-prefixed"
    requirement: D-07
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq (corrected scoping) — 0 Variable-pattern no-unused-vars findings across Task 1's 4 files"
        status: pass
      - kind: other
        ref: "pnpm build (tsc typecheck via vite build)"
        status: pass
    human_judgment: false
  - id: D2
    description: "8 dead locals removed across views: badge-details.tsx `navigate`, fallback-list-card.tsx
      `isSpecialList`, napplet.tsx `intent`, relay-details.tsx `url`, about.tsx `loading` (destructure element),
      search-results.tsx `loadingProfiles` (destructure element), mailboxes/index.tsx `info` underscore-prefixed,
      user-autocomplete.ts `lookupPromise` (declaration + assignment)"
    requirement: D-07
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json . | jq (corrected scoping) — 0 Variable-pattern no-unused-vars findings across Task 2's 8 files"
        status: pass
      - kind: other
        ref: "pnpm build (tsc typecheck via vite build)"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min
completed: 2026-09-15
status: complete
---

# Phase 04 Plan 04: Delete the 13 plain dead local variables (D-07) Summary

**Thirteen dead local bindings deleted across 12 files — 11 plain deletions, 2 underscore-prefixed
where the right-hand side's destructuring-exclusion or cache-warming effect had to survive.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-09-15T19:16:14-05:00
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Deleted all 13 plain dead local variables named in the plan's measured-facts table, confirmed
  by an aislop rescan (0 `eslint/no-unused-vars` "Variable ..." findings remaining in any of the
  12 files) and a passing `pnpm build`
- Correctly identified and preserved the two "assigned a value but never used" sites
  (`miner.ts`'s `bestHash`, `user-autocomplete.ts`'s `lookupPromise`) by reading their whole
  enclosing function/module and removing every assignment, not just the declaration
- Correctly identified the two destructuring-with-live-siblings sites (`about.tsx`'s `loading`,
  `search-results.tsx`'s `loadingProfiles`) and removed only the dead element, keeping the live
  sibling (`info`, `run: searchProfiles`)
- Found two sites the plan's measured-facts table didn't flag as "effect worth keeping" but that
  needed the same underscore-prefix treatment on inspection: `outbox-subscriptions.ts`'s `authors`
  (a destructuring-exclusion, not a plain unused binding) and `mailboxes/index.tsx`'s `info`
  (a cache-warming hook call) — both confirmed via `useRelayInfo`'s source and the surrounding
  destructuring semantics, not assumed
- Left `04-05`'s unused-parameter site and `04-10`'s duplicate-import sites in `highlight.tsx` and
  `badge-details.tsx` untouched, and left `fallback-list-card.tsx`'s pre-existing hook-order error
  (backlog 999.2) untouched — all confirmed still present post-edit via the plan's acceptance
  criteria

## Task Commits

1. **Task 1: Delete the dead locals in components and services (5 sites, 4 files)** - `b24e97beb` (fix)
2. **Task 2: Delete the dead locals across views (8 sites, 8 files)** - `7e7c7c771` (fix)

_No TDD tasks in this plan; each commit is a single fix commit per task._

## Files Created/Modified
- `src/components/note/note-menu.tsx` - removed unused `address` useMemo (pure getter) and the
  orphaned `useMemo`/`getSharableEventAddress` imports
- `src/components/pow/miner.ts` - removed `bestHash` declaration and its reassignment inside
  `mine()`'s progress branch
- `src/components/timeline/highlight.tsx` - removed `TimelineHighlight`'s unused `highlightText`
  and `context` locals (its sibling `HighlightContent` function keeps its own copies, which are
  live and untouched)
- `src/services/outbox-subscriptions.ts` - `authors` renamed to `_authors` in the rest-destructure
  (kept for its exclusion effect on `filterWithoutAuthors`)
- `src/views/badges/badge-details.tsx` - removed unused `navigate` (`useNavigate()`) and its
  orphaned import
- `src/views/lists/components/fallback-list-card.tsx` - removed `ListCardRender`'s duplicate
  unused `isSpecialList` local (the separate `createListLink` function's own `isSpecialList`,
  used at its own line 74, is untouched)
- `src/views/napplets/napplet.tsx` - removed `NappletView`'s unused `intent` useMemo and the
  orphaned `parseNappletIntent` import (`NappletRouteLoader`'s `intent` prop, a distinct binding,
  is unaffected)
- `src/views/relays/map/components/relay-details.tsx` - removed unused `url` alias of `identity`
- `src/views/relays/relay/tabs/about.tsx` - dropped only the dead `loading` element from
  `useRelayInfo`'s destructure, keeping the live `info` sibling
- `src/views/search/components/search-results.tsx` - dropped only the dead
  `loading: loadingProfiles` element from `useAsyncAction`'s destructure, keeping the live
  `run: searchProfiles` sibling
- `src/views/settings/mailboxes/index.tsx` - `OutboxRelay`'s `info` renamed to `_info` (kept for
  `useRelayInfo`'s cache-warming fetch side effect)
- `src/views/tools/event-console/user-autocomplete.ts` - removed `lookupPromise` declaration and
  its assignment; the `lookupUsers(...).then(...)` call and its `cachedUsers` side effect remain,
  now fire-and-forget

## Decisions Made
- `outbox-subscriptions.ts`'s `authors` kept as `_authors` rather than deleted: the binding exists
  solely to exclude `authors` from the rest-spread `filterWithoutAuthors`; removing it from the
  destructuring (rather than renaming it) would silently re-include `authors` in the filter passed
  to `pool.outboxSubscription`, breaking the documented "authors are added automatically from the
  outbox map" contract. This is a destructuring-exclusion effect, distinct from the plan's named
  "call worth keeping" cases, but the same underscore-prefix remedy applies.
- `mailboxes/index.tsx`'s `OutboxRelay` `info` kept as `_info` rather than deleted: read
  `src/hooks/use-relay-info.ts` and confirmed `useRelayInfo` performs an async fetch through
  `relayInfoService.getInfo(relay, alwaysFetch)`, which populates a shared cache. `OutboxRelay`
  never renders `info`-derived content (unlike its sibling `InboxRelay`, which does), but deleting
  the whole statement would stop warming that cache for outbox relay URLs. Kept the call,
  underscore-prefixed the binding, and left a one-line comment explaining why.
- `user-autocomplete.ts`'s `lookupPromise` removed outright (declaration and its one assignment)
  rather than underscore-prefixed: unlike the two cases above, nothing about the promise variable
  itself is load-bearing — no code anywhere reads `lookupPromise`, awaits it, or checks its
  pending/settled state. The load-bearing part is the `.then()` callback's `cachedUsers`
  assignment, which survives unchanged as a fire-and-forget call.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed the plan's own jq verify command (scoping bug, not applied to plan text)**
- **Found during:** Task 1 verification
- **Issue:** The plan's acceptance-criteria jq command
  `select(["file1","file2",...]|index(.filePath))` evaluates `.filePath` against the array literal
  it's piped into, not against the diagnostic object — `jq` errors with `Cannot index array with
  string "filePath"` (exit 5) every time it's run verbatim.
- **Fix:** Ran the equivalent check with corrected scoping:
  `select(.filePath as $fp | [...]|index($fp))`. No plan or source file was edited for this — it's
  a verification-script bug, not a code defect, and is called out here per the out-of-scope rule
  rather than silently worked around.
- **Files modified:** none (verification-only workaround)
- **Verification:** Corrected jq ran clean and returned `0` for both tasks' dead-variable counts
- **Committed in:** n/a (not a code change)

**2. [Rule 2 - discretion, not really a "bug"] Underscore-prefixed two sites the plan's
measured-facts table didn't flag by name**
- **Found during:** Task 1 (`outbox-subscriptions.ts`) and Task 2 (`mailboxes/index.tsx`)
- **Issue:** The plan's measured-facts table listed `authors` and `info` with no special note,
  implying plain deletions, but reading the surrounding code showed both had a real effect
  (destructuring-exclusion and cache-warming respectively) that a plain deletion would silently
  break.
- **Fix:** Applied the same underscore-prefix remedy the plan explicitly names for `navigate`
  (kept-call case), reasoned per-site as instructed ("decide what the right-hand side is before
  deleting").
- **Files modified:** `src/services/outbox-subscriptions.ts`, `src/views/settings/mailboxes/index.tsx`
- **Verification:** aislop rescan confirmed both files show 0 dead-variable findings after the
  rename; `pnpm build` passed
- **Committed in:** `b24e97beb` (outbox-subscriptions.ts), `7e7c7c771` (mailboxes/index.tsx)

---

**Total deviations:** 2 (1 verification-tooling workaround, 1 discretionary judgment call
extending the plan's own named pattern to two additional sites)
**Impact on plan:** No scope creep — both underscore-prefix decisions stay within the plan's own
stated judgment rule ("if it is a call/effect the surrounding code still depends on, keep it and
underscore-prefix instead"). The jq fix only affects how verification was run in this session, not
any tracked artifact.

## Issues Encountered
None beyond the deviations above.

## Next Phase Readiness
- All 13 plain dead locals from D-07's mechanical half are gone; `pnpm build` passes.
- `04-05` (unused-parameter sweep) and `04-10` (duplicate-import cleanup) still have their named
  sites untouched in `highlight.tsx` and `badge-details.tsx`, confirmed present post-edit.
- `fallback-list-card.tsx`'s pre-existing hook-order error (backlog 999.2) is untouched.
- No blockers for sibling plan 04-03 (judgment sites) or later-wave plans.

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-15*
