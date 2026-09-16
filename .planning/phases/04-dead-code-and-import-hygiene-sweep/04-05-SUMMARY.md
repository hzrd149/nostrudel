---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 05
subsystem: code-quality
tags: [eslint, aislop, unused-parameters, react-markdown, rxjs, idb, service-worker]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: D-06's `_`-prefix convention definition and remedy-shape mapping (04-PATTERNS.md)
provides:
  - 39 non-view unused-parameter findings resolved (10 markdown.tsx renderer signatures, 12
    component parameters, 17 helper/hook/provider/service/worker parameters)
  - First in-repo instances of the `_`-prefix convention across markdown renderers, RxJS/idb/
    service-worker callback signatures, and context-default stub functions
affects: [04-06 (views/ sibling plan), 04-VALIDATION, Phase 5 (relay-stats.ts thin-wrapper item)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unused parameter resolution test: contract-bound (event handlers, array-callback
      positions, React/applesauce/RxJS/idb callbacks, forwarded refs, interface
      implementations, context-default stubs matching a real implementation) -> prefix with
      `_`; merely-trailing with no caller passing a value -> delete."
    - "Destructured prop + rest spread onto a JSX element is a leak hazard: dropping an unused
      destructured property (rather than prefixing it) lets it flow into `...props` and get
      forwarded to a DOM/component boundary as an unrecognized attribute."

key-files:
  created: []
  modified:
    - src/components/markdown/markdown.tsx
    - src/components/blob-details-modal.tsx
    - src/components/compact-note-content.tsx
    - src/components/event-zap-modal/index.tsx
    - src/components/lightbox-provider.tsx
    - src/components/relay-url-input.tsx
    - src/components/timeline/highlight.tsx
    - src/components/timeline/note/components/share-modal.tsx
    - src/components/timeline/note/index.tsx
    - src/components/timeline/note/text-note-contents.tsx
    - src/helpers/nostr/relay-stats.ts
    - src/helpers/request.ts
    - src/hooks/use-dns-identity.ts
    - src/hooks/use-user-contact-relays.ts
    - src/hooks/use-user-pin-list.ts
    - src/providers/local/intersection-observer.tsx
    - src/providers/local/thread-provider.tsx
    - src/providers/route/debug-modal-provider.tsx
    - src/providers/route/mute-modal-provider.tsx
    - src/services/accounts.ts
    - src/services/database/index.ts
    - src/services/sqlite/migrations.ts
    - src/sw/worker/sw.ts

key-decisions:
  - "markdown.tsx: all 10 renderer signatures (H1-H6, A, P, TableWithContainer, CustomCode) carry
    a `...props` rest element, so all 10 were renamed node -> _node in place; none were dropped."
  - "hideDrawerButton (timeline/highlight.tsx + timeline/note/index.tsx) and noOpenGraphLinks
    (text-note-contents.tsx) were deleted entirely from both their prop type and destructuring
    -- confirmed via whole-repo grep that no caller anywhere passes them and neither component
    body references them, satisfying the plan's condition for full removal rather than prefix."
  - "relay-stats.ts's name param was prefixed (contract-bound, Phase 5 thin-wrapper target
    per plan instruction to touch only the parameter) despite discovering the function body
    ignores name entirely and always filters on the literal \"open\" tag -- a likely pre-existing
    bug (read/write RTT values are duplicates of open's) left unfixed and flagged below,
    out of scope for this lint-only plan."
  - "event-zap-modal's relays and compact-note-content's textOnly were prefixed rather than
    deleted after grep found real callers passing them (goal-zap-button.tsx passes relays;
    mention-card.tsx/quote-card.tsx/reply-context.tsx pass textOnly) even though neither
    component's body reads the value -- deleting would break those callers' JSX prop usage."

patterns-established:
  - "`_`-prefix for contract-bound unused parameters: the shape is `paramName: _paramName` for
    destructured object/array patterns and `_paramName` for plain positional parameters."

requirements-completed: [D-06]

coverage:
  - id: D1
    description: "10 react-markdown renderer signatures in markdown.tsx have their unused node
      parameter renamed to _node in place (never dropped, since a ...props rest element is
      present at every site)"
    requirement: "D-06"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq filePath==markdown.tsx && rule==eslint/no-unused-vars -> 0; grep -c _node markdown.tsx -> 10; pnpm build"
        status: pass
    human_judgment: false
  - id: D2
    description: "12 unused parameters across 9 further component files resolved (prefix where
      contract-bound / caller passes a value that would otherwise leak into a rest spread;
      delete where genuinely dead code with zero callers)"
    requirement: "D-06"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq targeted 9-file unused-parameter finding count -> 0; pnpm build"
        status: pass
    human_judgment: false
  - id: D3
    description: "17 unused parameters across 13 helper/hook/provider/service/service-worker
      files resolved with the same contract-bound-vs-trailing test"
    requirement: "D-06"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq whole-repo eslint/no-unused-vars Parameter findings outside views/ (excluding 04-07/04-08's two files) -> 0; pnpm build"
        status: pass
    human_judgment: false

duration: ~35min
completed: 2026-09-15
status: complete
---

# Phase 04 Plan 05: Non-view unused-parameter resolution (D-06) Summary

**Resolved all 39 unused-parameter lint findings outside `src/views/` by prefixing contract-bound
parameters with `_` (React/react-markdown/RxJS/idb/ServiceWorker callback signatures, context
stub defaults, array-callback destructures) and deleting genuinely trailing ones with zero
callers, originating the repo's first `_`-prefix convention across three commits.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3
- **Files modified:** 23

## Accomplishments

- All 10 `markdown.tsx` renderer signatures (H1-H6, A, P, TableWithContainer, CustomCode) keep
  `node` bound under `_node` since every one has a `...props` rest spread — none were safe to drop
- 12 component-level parameters resolved: array-callback indices and destructures prefixed,
  context-default stub functions in `lightbox-provider.tsx` prefixed to match their real
  implementations, `hideDrawerButton` deleted entirely from two files sharing the same dead-prop
  shape after confirming zero callers repo-wide
- 17 helper/hook/provider/service/service-worker parameters resolved: two trailing `force` flags
  deleted (grepped zero callers), two `Promise.catch` error bindings deleted, RxJS/idb/
  ServiceWorker/applesauce-accounts callback parameters prefixed as contract-bound
- Whole-repo unused-parameter finding count outside `views/`, excluding the two files owned by
  04-07/04-08, confirmed `0` via the plan's jq assertion; `pnpm build` passed after every task

## Task Commits

Each task was committed atomically:

1. **Task 1: Resolve the 10 markdown renderer signatures** - `7a13561ce` (fix)
2. **Task 2: Resolve the 12 remaining component parameters** - `7a5e2faa0` (fix)
3. **Task 3: Resolve the 17 parameters in helpers, hooks, providers, services and the worker** - `30f0ff230` (fix)

## Files Created/Modified

- `src/components/markdown/markdown.tsx` - all 10 renderer signatures: `node` -> `_node`
- `src/components/blob-details-modal.tsx` - `.map((server, i))` -> `_i` (array-callback position)
- `src/components/compact-note-content.tsx` - `textOnly` -> `_textOnly` (caller-passed, rest-spread hazard)
- `src/components/event-zap-modal/index.tsx` - `relays` -> `_relays` (caller-passed, rest-spread hazard)
- `src/components/lightbox-provider.tsx` - context-default stubs' `ref`x3/`slide` prefixed
- `src/components/relay-url-input.tsx` - RxJS `next` callback's `relayMap` -> `_relayMap`
- `src/components/timeline/highlight.tsx` - `hideDrawerButton` deleted (type + destructuring)
- `src/components/timeline/note/components/share-modal.tsx` - `.catch((err))` -> `.catch()`
- `src/components/timeline/note/index.tsx` - `hideDrawerButton` deleted (type + destructuring)
- `src/components/timeline/note/text-note-contents.tsx` - `noOpenGraphLinks` deleted (type + destructuring)
- `src/helpers/nostr/relay-stats.ts` - `getRTTTag`'s `name` -> `_name`
- `src/helpers/request.ts` - both `.catch((e))` -> `.catch()`
- `src/hooks/use-dns-identity.ts` - trailing `force` param deleted
- `src/hooks/use-user-contact-relays.ts` - both `.filter(([relay, mode]))` destructures -> `_relay`
- `src/hooks/use-user-pin-list.ts` - trailing `force` param deleted
- `src/providers/local/intersection-observer.tsx` - `IntersectionObserverCallback`'s `observer` -> `_observer`
- `src/providers/local/thread-provider.tsx` - context-default stub's `id` -> `_id`
- `src/providers/route/debug-modal-provider.tsx` - context-default stub's `event` -> `_event`
- `src/providers/route/mute-modal-provider.tsx` - both `.filter(([pubkey, ex]))` destructures -> `_pubkey`
- `src/services/accounts.ts` - `requestUnlockPassword`'s `account` -> `_account`
- `src/services/database/index.ts` - `openDB` `upgrade` callback's `event` -> `_event`
- `src/services/sqlite/migrations.ts` - legacy `runMigrations`'s `sqlite` -> `_sqlite`
- `src/sw/worker/sw.ts` - both `install`/`activate` listener callbacks' `event` -> `_event`

## Decisions Made

- **markdown.tsx (10/10 renamed, 0 dropped):** every renderer destructures `node` alongside a
  `...props` rest element that is spread onto a Chakra component, so dropping `node` from the
  destructuring would forward it to the DOM as an unrecognized attribute. All ten were renamed
  in place (`node: _node`), none were dropped.
- **`hideDrawerButton` (highlight.tsx + note/index.tsx) and `noOpenGraphLinks`
  (text-note-contents.tsx):** confirmed via whole-repo grep that no caller anywhere passes these
  props and neither component body references them internally. Per the plan's explicit condition
  ("do not remove the property from the shared type unless neither component uses it and no
  caller passes it"), both were satisfied, so the property was deleted entirely from both the
  prop type and the destructuring in all three files — not merely prefixed. `highlight.tsx` and
  `note/index.tsx` define separate (not literally shared) but structurally identical prop types;
  the same full-deletion remedy was applied to both for consistency, per the plan's explicit
  instruction to check for this and keep the two files coherent.
- **`event-zap-modal/index.tsx`'s `relays` and `compact-note-content.tsx`'s `textOnly`:** grep
  found real callers passing these props (`goal-zap-button.tsx` passes `relays`;
  `mention-card.tsx`, `quote-card.tsx`, and `reply-context.tsx` pass `textOnly`), even though
  neither component's body reads the value. Deleting either from the prop type would break those
  callers' JSX usage (excess-property errors), so both were prefixed in place instead
  (`relays: _relays`, `textOnly: _textOnly = false`), which also prevents the value from leaking
  into each component's `...props` rest spread.
- **`lightbox-provider.tsx`'s context-default stubs (3x `ref`, 1x `slide`), `thread-provider.tsx`'s
  `id`, and `debug-modal-provider.tsx`'s `event`:** these are no-op placeholder functions assigned
  as `createContext(...)` default values; their real implementations (supplied later via the
  Provider's `useMemo`'d context value) use these same parameters. Prefixing keeps the inferred
  context type's signature aligned with the real implementation without breaking `useContext`
  consumers that call e.g. `showSlide(ref)` or `open(event)` with an argument.
- **`relay-stats.ts`'s `getRTTTag` `name` param:** prefixed (not restructured), per the plan's
  explicit instruction to touch only the parameter since this file is a named Phase 5
  thin-wrapper target. See Issues Encountered for the pre-existing bug discovered here.
- **`use-dns-identity.ts`'s and `use-user-pin-list.ts`'s trailing `force` params:** grepped every
  call site of both hooks repo-wide (including the `use-user-dns-identity.ts` wrapper); zero
  callers pass a value for `force` in either hook, so both were deleted entirely rather than
  prefixed.
- **Array-destructure callback positions** (`use-user-contact-relays.ts`'s `relay`,
  `mute-modal-provider.tsx`'s `pubkey`, `blob-details-modal.tsx`'s `i`): treated as contract-bound
  array-callback positions per the plan's explicit category list, so all were prefixed with `_`
  rather than using an array hole (`[, mode]`), keeping the convention consistent across the plan.
- **Plain `Promise.catch` error bindings** (`share-modal.tsx`'s `err`, both of `request.ts`'s `e`):
  these are not destructured, carry no rest-spread hazard, and no interface/type requires the
  binding to stay declared, so all three were deleted entirely rather than prefixed.
- **`relay-url-input.tsx`'s RxJS `next` callback's `relayMap`:** treated as an interface
  implementation of `Observer<T>`'s `next` shape (contract-bound per the plan's category list) and
  prefixed rather than deleted, consistent with the treatment of other callback/interface sites in
  this plan.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1-4 auto-fixes were applied; the one candidate
bug found (`relay-stats.ts`, see below) was deliberately left untouched per the plan's own explicit
instruction not to restructure that function, and is documented as a deferred item rather than
silently fixed or silently ignored.

## Issues Encountered

- **Tooling bug in the plan's Task 2/3 verify jq commands, worked around:** the plan's
  `<automated>` verify command for Task 2 uses `select([...] | index(.filePath))`, which is
  invalid jq — piping an array literal into `index(.filePath)` breaks the `.` context and errors
  with `Cannot index array with string "filePath"` (exit 5). Used the corrected equivalent,
  `select(.filePath as $f | [...] | index($f))`, for all verification in this plan. Did not edit
  the plan file itself, per instruction.
- **Pre-existing bug discovered, deliberately not fixed (deferred):** `src/helpers/nostr/relay-stats.ts`'s
  `getRTTTag(stats, name)` ignores its `name` parameter entirely — the body always filters for
  `t[1] === "open"` regardless of what `name` is called with. Its three call sites in `getRTT()`
  pass `"open"`, `"read"`, and `"write"` respectively, so the `read` and `write` RTT values
  currently returned are duplicates of the `open` value (or `undefined` if no "open" rtt tag
  exists) rather than their own distinct data. This predates this plan's edit and is unrelated to
  the D-06 lint fix; the plan explicitly instructs "touch only the parameter here; do not inline
  or restructure the function" since this file is a named Phase 5 thin-wrapper target, so the
  parameter was prefixed (`_name`) and the bug was left in place. Flagging here for whoever picks
  up the Phase 5 relay-stats.ts work, or for a future backlog item, since it is a real functional
  defect (relay stats read/write RTT display is wrong), not merely a lint concern.
- **Pre-existing aislop findings surfaced in touched files (not introduced by this plan, left
  untouched per `.claude/CLAUDE.md`'s override and the out-of-scope rule):** the PostToolUse hook
  reported pre-existing warnings in several Task 3 files after each edit —
  `ai-slop/thin-wrapper` in `relay-stats.ts` (the `getRelayURL` function, unrelated to the edited
  `getRTTTag`), `ai-slop/trivial-comment` in `accounts.ts` (3), `sqlite/migrations.ts` (3), and
  `sw.ts` (3), `ai-slop/console-leftover` in `sw.ts` (6), and `ai-slop/double-type-assertion` in
  `services/database/index.ts` (16, the `as unknown as Schema*` casts throughout the `upgrade`
  callback's version-migration branches). Confirmed via `git diff --stat` on each file that this
  plan's edit was a 1-2 line parameter rename only, so none of these findings were introduced by
  this plan; all belong to backlog phases 999.2-999.10 and were left untouched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- D-06's non-view half is fully resolved; the sibling worktree plan (04-06) owns the `views/`
  half of the same decision on a disjoint file set.
- `src/helpers/nostr/relay-stats.ts`'s `getRTTTag` name-ignoring bug is flagged above for
  whoever executes Phase 5's thin-wrapper item on this file, or for a new backlog entry if Phase
  5 doesn't cover it — it is a functional defect, not a lint finding.
- No blockers for 04-VALIDATION's whole-repo D-06 rescan.

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-15*

## Self-Check: PASSED

- FOUND: src/components/markdown/markdown.tsx
- FOUND: src/components/blob-details-modal.tsx
- FOUND: src/components/compact-note-content.tsx
- FOUND: src/components/event-zap-modal/index.tsx
- FOUND: src/components/lightbox-provider.tsx
- FOUND: src/components/relay-url-input.tsx
- FOUND: src/components/timeline/highlight.tsx
- FOUND: src/components/timeline/note/components/share-modal.tsx
- FOUND: src/components/timeline/note/index.tsx
- FOUND: src/components/timeline/note/text-note-contents.tsx
- FOUND: src/helpers/nostr/relay-stats.ts
- FOUND: src/helpers/request.ts
- FOUND: src/hooks/use-dns-identity.ts
- FOUND: src/hooks/use-user-contact-relays.ts
- FOUND: src/hooks/use-user-pin-list.ts
- FOUND: src/providers/local/intersection-observer.tsx
- FOUND: src/providers/local/thread-provider.tsx
- FOUND: src/providers/route/debug-modal-provider.tsx
- FOUND: src/providers/route/mute-modal-provider.tsx
- FOUND: src/services/accounts.ts
- FOUND: src/services/database/index.ts
- FOUND: src/services/sqlite/migrations.ts
- FOUND: src/sw/worker/sw.ts
- FOUND commit 7a13561ce
- FOUND commit 7a5e2faa0
- FOUND commit 30f0ff230
