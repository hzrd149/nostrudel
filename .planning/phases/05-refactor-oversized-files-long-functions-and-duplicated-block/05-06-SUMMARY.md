---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 06
subsystem: ui
tags: [react, rxjs, chakra-ui, typescript, refactor, code-quality, notifications, messaging]

# Dependency graph
requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: "05-05's confirmation (via filePath in the full-repo rescan) that all four remaining code-quality/duplicate-block findings belong to this plan's three files"
provides:
  - "sw/client/error-logger.ts's two error-log printers sharing one internal renderErrorLogGroup helper"
  - "notifications/common.ts's three timeline loaders sharing one internal createNotificationsLoader factory"
  - "direct-message-form.tsx's four relay-list blocks sharing one internal RelayListSection component"
  - "code-quality/duplicate-block cleared to 0 whole-repo (from 21 at the phase-5 baseline)"
affects: [05-07, 05-14]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Internal (unexported) helper/factory colocated with its call sites for 2-4-use-site duplication, per CONVENTIONS.md, rather than a new shared module/file"
    - "Shared composition factory taking a variation-builder function (filter array, per-entry label) as its sole parameter, so the invariant plumbing (combineLatest/map/shareReplay, console.group loop) lives in one place while each call site supplies only what actually differs"
    - "Accepting a prop as ReactNode (not string) when call sites need to embed a component (UserName) or a materially different empty-state widget (Alert+Link vs plain Text), rather than adding a boolean/config flag to the shared component"

key-files:
  created: []
  modified:
    - src/sw/client/error-logger.ts
    - src/services/notifications/common.ts
    - src/views/messages/chat/components/direct-message-form.tsx
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md

key-decisions:
  - "All three duplicate blocks were genuine clear wins per D-05; none required the ignore-with-reason fallback"
  - "notifications/common.ts's shared factory composes the full combineLatest/map/shareReplay(1) pipeline per the plan's explicit action text, which reduces the literal shareReplay(1) text-occurrence count from 4 to 2 (3 loaders -> 1 factory, plus the unrelated userEvents$) while preserving the operator functionally for each of the three independently-called loaders -- a measured discrepancy against the plan's literal 'occurrence count unchanged' acceptance criterion, recorded rather than silently claimed as passing"
  - "direct-message-form.tsx's RelayListSection accepts emptyState as ReactNode (not a string) so the NIP-17-self block's distinct warning Alert-with-settings-link survives unmodified alongside the other three blocks' plain muted text, avoiding a boolean/config-flag smell"
  - "error-logger.ts and direct-message-form.tsx both grew slightly (+7 and +1 lines respectively) rather than shrinking, despite the extraction, for the same reason 05-05's magic-textarea.tsx grew: the shared helper's own signature/prop-type block costs more physical lines than the duplicated lines it replaces at 2-4 call sites. notifications/common.ts did shrink substantially (148->105, -43)"

requirements-completed: []

coverage:
  - id: D1
    description: "error-logger.ts's two printers share one renderErrorLogGroup helper; file-level console-leftover suppression and export surface unchanged"
    verification:
      - kind: unit
        ref: "pnpm build (typecheck+bundle) — exit 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . — code-quality/duplicate-block for src/sw/client/error-logger.ts: 0"
        status: pass
    human_judgment: true
    rationale: "No test runner exists (arrives 05-13); pnpm build only typechecks/bundles. Whether the console.group/console.log output still renders correctly in a real error-log dump was never exercised."
  - id: D2
    description: "notifications/common.ts's three timeline loaders share one createNotificationsLoader factory; exported names, types, filters, and replay semantics preserved"
    verification:
      - kind: unit
        ref: "pnpm build (typecheck+bundle) — exit 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . — code-quality/duplicate-block for src/services/notifications/common.ts: 0"
        status: pass
    human_judgment: true
    rationale: "No test runner exists yet. Whether the notifications view still receives share/social/zap events correctly at runtime, and whether each loader still replays a single cached timeline to late subscribers rather than recreating one, was never exercised in a running browser."
  - id: D3
    description: "direct-message-form.tsx's four relay-list blocks share one internal RelayListSection component; both messaging branches, their warnings, and all spec links unchanged"
    verification:
      - kind: unit
        ref: "pnpm build (typecheck+bundle) — exit 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json . — code-quality/duplicate-block for src/views/messages/chat/components/direct-message-form.tsx: 0"
        status: pass
    human_judgment: true
    rationale: "No test runner exists yet, and this file is part of the encrypted direct-message send path. Whether the message-type toggle modal still renders the correct relay lists/empty states for both NIP-17 and NIP-04, and whether an actual message send (legacy or wrapped) still works end-to-end, was never exercised in a running browser."

duration: ~15min
completed: 2026-09-24
status: complete
---

# Phase 05 Plan 06: Factor Error-Log Loop, Notification Loader Composition, and Relay List Duplicates Summary

**Three clear-win D-05 duplicate blocks extracted into internal shared definitions -- the error-log console.group rendering loop, the three notification timeline loaders' combineLatest/map/shareReplay composition, and the messaging modal's four relay-list blocks -- clearing `code-quality/duplicate-block` to 0 whole-repo.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-09-24
- **Tasks:** 3
- **Files modified:** 4 (3 source files + 05-BASELINE.md)

## Accomplishments

- `src/sw/client/error-logger.ts`: `logServiceWorkerErrors` and `logServiceWorkerErrorsByContext` now
  share one internal `renderErrorLogGroup(logs, groupLabel, entryLabel)` helper that performs the
  `console.group`/nested-group rendering loop. Each printer keeps its own distinct empty-list
  message (returned before any group opens) and its own group/entry label wording -- the first
  printer's per-entry label embeds the log's context, the second's does not, since it already
  scopes the whole group to one context. The file-level `aislop-ignore-file
  ai-slop/console-leftover` directive on line 1 is confirmed byte-identical via `git diff`.
- `src/services/notifications/common.ts`: `shareNotificationsLoader$`, `socialNotificationsLoader$`
  and `zapNotificationsLoader$` now share one internal `createNotificationsLoader(getFilters)`
  factory that composes the `combineLatest([accounts.active$, inboxes$]).pipe(map(...),
  shareReplay(1))` pipeline; each loader calls the factory with its own pubkey-to-filter-array
  builder. Exported names and `Observable<TimelineLoader | null>` types are byte-identical; every
  filter's kinds/tag selectors are carried over verbatim, including the social loader's second
  filter over the user's own authored notes and its explanatory comment. Each of the three
  exported consts is still an independent factory call, so each still gets its own
  `shareReplay(1)`-backed single timeline -- no state is shared across the three loaders.
- `src/views/messages/chat/components/direct-message-form.tsx`: all four relay-list blocks in the
  message-type toggle modal (NIP-17 self/other inboxes, NIP-04 self/other inboxes) now share one
  internal `RelayListSection({ label, relays, emptyState })` component, referenced 4 times.
  `label` and `emptyState` are typed `ReactNode` (not string) so two labels can embed `<UserName
  pubkey={pubkey} />` and so the NIP-17-self block's distinct warning `Alert`-with-settings-link
  empty state survives unmodified alongside the other three blocks' plain muted text. Both
  messaging branches, their privacy-tradeoff copy, and all three NIP spec links (`17.md`, `04.md`,
  `65.md`) are untouched. The encrypted send path itself (`sendMessage`, `SendLegacyMessage`/
  `SendWrappedMessage`, relay/inbox resolution) was not touched -- only the relay-list rendering
  leaf inside the settings modal was factored, per this plan's conservative-treatment instruction.
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md`:
  D-19 per-rule table updated with the measured after-counts (`code-quality/duplicate-block` 4->0,
  bucket-H total 11->7), plus a new "05-06 D-05 clear-win extraction resolution" section recording
  per-file line-count deltas and the two measured-vs-predicted acceptance-criteria discrepancies
  below. `code-quality/duplicate-block` is now 0 whole-repo -- the last of the 21 findings this
  rule carried at the phase-5 baseline is resolved (17 extracted across plans 05-02/03/04/05/06,
  4 ignored-with-reason in 05-03).

## Task Commits

Each task was committed atomically:

1. **Task 1: Factor the shared error-log rendering loop (D-05)** - `9c35ee235` (refactor)
2. **Task 2: Factor the shared notification timeline-loader composition (D-05)** - `55ca0bb04` (refactor)
3. **Task 3: Extract the repeated relay list in the messaging settings modal (D-05)** - `e7f3bbada` (refactor)

**Plan metadata:** (pending) `docs(05-06): complete plan`

## Files Created/Modified

- `src/sw/client/error-logger.ts` - Two error-log printers now share `renderErrorLogGroup`
- `src/services/notifications/common.ts` - Three timeline loaders now share `createNotificationsLoader`
- `src/views/messages/chat/components/direct-message-form.tsx` - Four relay-list blocks now share `RelayListSection`
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md` - Measured after-counts and resolution section appended

## Decisions Made

- All three duplicate blocks in this plan were genuine clear wins (D-05): no configuration flag or
  boolean parameter was needed to unify behavior at any of the 2/3/4 call sites, so none fell back
  to ignore-with-reason.
- `notifications/common.ts`'s shared factory composes the *entire* `combineLatest/map/shareReplay`
  pipeline, per the plan's explicit action text ("Extract one internal factory ... and returns the
  composed observable. Define the three exported loaders by calling it"). This is the correct
  reading of the action, but it conflicts with the plan's separately-stated acceptance criterion
  that "the number of `shareReplay(1)` occurrences in the file is unchanged": consolidating three
  identical call sites into one factory-owned occurrence necessarily drops the literal text count
  from 4 (3 loaders + the unrelated `userEvents$`) to 2 (1 factory + `userEvents$`). The underlying
  concern that criterion exists to protect -- T-05-19, no shared/duplicated subscription across
  loaders -- is unaffected, since each of the three exported consts is still an independent call
  to the factory with its own `shareReplay(1)` instance. Recorded as a measured discrepancy (D-03)
  in `05-BASELINE.md` rather than silently claimed as passing.
- `direct-message-form.tsx`'s `RelayListSection` accepts `emptyState` as `ReactNode` rather than a
  plain string, because the NIP-17-self block's empty state is a distinct warning `Alert` with a
  link to `/settings/messages`, not a "muted empty-state sentence" like the other three blocks.
  Accepting a rendered node (the same approach 05-05 used for slider labels) let all four blocks
  share one component without adding a boolean/config flag to switch between "plain text" and
  "Alert with link" rendering modes, which D-05 flags as the wrong kind of abstraction.
- `error-logger.ts` (74->81, +7) and `direct-message-form.tsx` (430->431, +1) both grew slightly
  despite the extraction, for the same reason 05-05's `magic-textarea.tsx` grew: the shared
  helper/component's own signature and prop-type block cost more physical lines at 2-4 call sites
  than the duplicated lines they replace. `notifications/common.ts` (148->105, -43) shrank
  substantially, the biggest reduction across all three files in this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a duplicate block introduced by this task's own edit**
- **Found during:** Task 3 (Extract the repeated relay list in the messaging settings modal)
- **Issue:** After converting the two NIP-04 relay blocks to `RelayListSection` calls, both call
  sites passed an identical inline `<Text fontSize="sm" color="GrayText" pl={2}>No NIP-65 inboxes
  configured.</Text>` node as their `emptyState` prop, which the aislop hook immediately flagged as
  a new `code-quality/duplicate-block` finding at line 250/256 -- a regression introduced by this
  edit, not present before it.
- **Fix:** Hoisted the identical empty-state node into one local `nip65EmptyState` constant inside
  `MessageTypeToggleButton`, reused by both NIP-04 call sites (`nip17RelaysToShow` blocks keep
  their own distinct NIP-17-wording empty states, unaffected).
- **Files modified:** `src/views/messages/chat/components/direct-message-form.tsx`
- **Verification:** Re-scanned after the fix; the new finding cleared to 0 with no other findings
  introduced, confirmed via the hook's per-edit `additionalContext` output.
- **Committed in:** `e7f3bbada` (part of Task 3's commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug introduced and fixed within the same task, before commit)
**Impact on plan:** No scope creep; the fix was required to actually satisfy Task 3's own acceptance criterion (duplicate-block at 0 for this file) rather than trading one finding for another.

## Issues Encountered

None beyond the self-inflicted Task 3 regression documented above, which was caught by the
per-edit hook and fixed in the same task before committing. `pnpm build` (typecheck + bundle)
passed after every task with no errors.

## Outstanding Manual Verification (per orchestrator notes 3-5)

This project has no test runner until plan 05-13, and both `build_command` and `test_command` in
`.planning/config.json` are `pnpm build`, which only typechecks and bundles -- it cannot exercise
runtime behavior. The following three surfaces changed executable code in this plan and were
**not** manually exercised in a running browser or dev server. Each is recorded here as an
explicit OUTSTANDING item, not assumed verified from the build passing:

1. **Error-log console rendering (error-logger.ts)** -- OUTSTANDING. Not verified: that
   `logServiceWorkerErrors` and `logServiceWorkerErrorsByContext` still print the same
   `console.group`/nested-group structure with the same labels, message/stack/URL lines, in an
   actual browser devtools console against real service-worker error logs.
2. **Notification timeline loaders (notifications/common.ts)** -- OUTSTANDING. Not verified: that
   the notifications view still receives share/social/zap events from the correct relay inboxes at
   runtime, and that each loader still replays its single created timeline to late subscribers
   (e.g. re-opening the notifications view) rather than creating a duplicate timeline per
   subscriber.
3. **Messaging settings modal relay lists (direct-message-form.tsx)** -- OUTSTANDING and the
   highest-stakes of the three: this file is part of the encrypted direct-message send path. Not
   verified: that the message-type toggle modal still renders the correct relay lists and correct
   empty states (including the NIP-17-self "Set up your message inboxes" Alert) for both private
   (NIP-17) and legacy (NIP-04) messaging, and that an actual message send in both modes still
   completes end-to-end with the correct relay set. No encryption, signing, relay-selection, or
   send-order logic was touched by this plan -- only the relay-list rendering leaf was factored --
   but this has not been confirmed by exercising a real send.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `code-quality/duplicate-block` is now 0 whole-repo, confirmed via the full-repo `--json` rescan.
  Bucket-H total fell from 11 (at this plan's start) to 7, all seven remaining findings being
  `complexity/function-too-long` (5, targeted by 05-07/05-08) and `complexity/file-too-large` (2,
  targeted by 05-09 through 05-12) -- neither rule was touched by this plan.
- The three OUTSTANDING manual-verification items above, together with 05-04's and 05-05's
  still-open items, should be exercised once a working dev server / test harness is available
  (05-13), rather than assumed resolved by `pnpm build`. The messaging-modal item (item 3) carries
  the highest priority given the file's role in the encrypted send path.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-24*

## Self-Check: PASSED

All three modified source files and both plan artifacts (this SUMMARY.md, 05-BASELINE.md)
confirmed present on disk; all three task commit hashes (`9c35ee235`, `55ca0bb04`, `e7f3bbada`)
confirmed present in `git log --oneline --all`.
