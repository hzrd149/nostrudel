---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 05
subsystem: ui
tags: [react, chakra-ui, typescript, refactor, code-quality]

# Dependency graph
requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: "05-01's corrected ROADMAP.md Phase 5 entry and 05-BASELINE.md's per-finding disposition table"
provides:
  - "magic-textarea.tsx's twin forwardRef autocomplete components sharing one createAutocompleteProps() factory"
  - "article-reader.tsx's three voice sliders sharing one internal VoiceSlider component"
  - "notifications/index.tsx's six navigation-box metadata badges sharing one internal NotificationCountBadge component"
affects: [05-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Internal (unexported) PascalCase JSX helper colocated with its call sites for 2-6-use-site duplication, per CONVENTIONS.md, rather than a new shared component file"
    - "Plain (non-hook) factory function returning a shared props object for two forwardRef-wrapped variants that differ only in element type and default label"

key-files:
  created: []
  modified:
    - src/components/magic-textarea.tsx
    - src/views/articles/components/article-reader.tsx
    - src/views/notifications/index.tsx
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md

key-decisions:
  - "All three sites were genuine clear wins per D-05 (no configuration flag needed to unify behavior); none required the ignore-with-reason fallback"
  - "magic-textarea.tsx's file line count grew (+5, 217->222) despite the extraction, because the factory's TypeScript generics and 8-property return object cost more lines than the 16 duplicated JSX prop lines they replaced -- a measured discrepancy against the plan's 'file is shorter' prediction, recorded rather than assumed"
  - "notifications/index.tsx's NotificationCountBadge converts all six navigation boxes, not just the two the scanner flagged, because the rule reports one finding per matched pair rather than per occurrence"

requirements-completed: []

coverage:
  - id: D1
    description: "MagicInput/MagicTextArea share one createAutocompleteProps() factory; export surface, displayName asymmetry, and TS suppression directives unchanged"
    verification:
      - kind: unit
        ref: "pnpm build (typecheck+bundle) — exit 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json src/components/magic-textarea.tsx — code-quality/duplicate-block: 0"
        status: pass
    human_judgment: true
    rationale: "No test runner exists (arrives 05-13); pnpm build only typechecks/bundles. The autocomplete's actual behavior (opening on trigger, selecting an emoji/user, inserting the token) was never exercised in a running browser."
  - id: D2
    description: "article-reader.tsx's three voice sliders (speed, pitch, volume) share one internal VoiceSlider component, each keeping its own label format"
    verification:
      - kind: unit
        ref: "pnpm build (typecheck+bundle) — exit 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json src/views/articles/components/article-reader.tsx — code-quality/duplicate-block: 0"
        status: pass
    human_judgment: true
    rationale: "No test runner exists yet. Whether the three sliders still bind to the correct value/onChange pair and still move the actual speech rate/pitch/volume was never exercised in a running browser."
  - id: D3
    description: "notifications/index.tsx's six navigation boxes share one internal NotificationCountBadge component; zero-count null and all-time label omission preserved"
    verification:
      - kind: unit
        ref: "pnpm build (typecheck+bundle) — exit 0"
        status: pass
      - kind: other
        ref: "pnpm exec aislop scan --json src/views/notifications/index.tsx — code-quality/duplicate-block: 0"
        status: pass
    human_judgment: true
    rationale: "No test runner exists yet. Whether each badge still renders the correct per-category count and time-range label in a running browser was never exercised."

duration: ~15min
completed: 2026-09-24
status: complete
---

# Phase 05 Plan 05: Factor Twin Autocomplete, Voice Slider, and Notification Badge Duplicates Summary

**Three clear-win D-05 duplicate blocks extracted into internal shared definitions -- twin autocomplete `forwardRef` components, three voice sliders, and six notification-badge call sites -- with every export surface byte-identical and zero configuration flags added to paper over real differences.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-09-24
- **Tasks:** 3
- **Files modified:** 4 (3 source files + 05-BASELINE.md)

## Accomplishments

- `src/components/magic-textarea.tsx`: `MagicInput` and `MagicTextArea` now share one internal
  `createAutocompleteProps()` factory that takes the rendered element, default aria-label,
  triggers, ref, and aria-label override, and returns the eight shared autocomplete props. Each
  component keeps its own `forwardRef` wrapper, generic type parameters, and ref-bridging
  expression -- the genuinely differing parts. Export statement, the textarea-only `displayName`
  assignment, and both `@ts-expect-error`/`@ts-ignore` suppression comments are byte-identical to
  before.
- `src/views/articles/components/article-reader.tsx`: a new internal `VoiceSlider` component
  (with a colocated `VoiceSliderProps` type alias) backs all three settings-grid sliders. Each
  call site still computes and passes its own formatted label as a rendered node (`x{n.toFixed(1)}`
  for speed/pitch, `{Math.round(n * 100)}%` for volume) rather than the component holding a
  format-mode flag.
- `src/views/notifications/index.tsx`: a new internal `NotificationCountBadge` component backs the
  `metadata` prop on all six `SimpleNavBox` boxes (replies, mentions, threads, quotes, reposts,
  zaps) -- not just the two the scanner flagged, since the rule reports one finding per matched
  pair. The zero-count `return null` guard and the all-time range-label omission are preserved
  exactly, including the pre-existing (now redundant but untouched, per the plan's instruction)
  `count > 0 ? "primary" : "gray"` ternary.
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md`:
  D-19 per-rule table updated with the measured after-counts (`code-quality/duplicate-block`
  9->4, bucket-H total 16->11), plus a new "05-05 D-05 clear-win extraction resolution" section
  recording per-file line-count deltas and confirming via the full-repo `--json` rescan's
  `filePath` field that all 4 remaining `duplicate-block` findings belong to plan 05-06's files,
  not these three.

## Task Commits

Each task was committed atomically:

1. **Task 1: Factor the twin autocomplete components (D-05)** - `ac63316ce` (refactor)
2. **Task 2: Extract the repeated voice slider (D-05)** - `083fc481b` (refactor)
3. **Task 3: Extract the repeated notification count badge (D-05)** - `47d194617` (refactor)

**Plan metadata:** (pending) `docs(05-05): complete plan`

## Files Created/Modified

- `src/components/magic-textarea.tsx` - Twin autocomplete components now share `createAutocompleteProps()`
- `src/views/articles/components/article-reader.tsx` - Three voice sliders now share `VoiceSlider`
- `src/views/notifications/index.tsx` - Six navigation-box badges now share `NotificationCountBadge`
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md` - Measured after-counts and resolution section appended

## Decisions Made

- All three duplicate blocks in this plan were genuine clear wins (D-05): no configuration flag
  or boolean parameter was needed to unify the two/three/six sites' behavior, so none fell back to
  ignore-with-reason.
- `magic-textarea.tsx` grew by 5 lines (217->222) despite the extraction -- the shared factory's
  TypeScript generics (`<E, R>`) and its 8-property return object cost more physical lines than
  the 16 duplicated JSX prop lines they replaced. This is a measured discrepancy against the
  plan's "file is shorter than before" acceptance criterion; the primary criterion (scoped rescan
  shows `code-quality/duplicate-block` at 0 for this file) is met and confirmed. `article-reader.tsx`
  (331->329) and `notifications/index.tsx` (171->131) both did shrink, the latter substantially.
- `notifications/index.tsx`'s `NotificationCountBadge` converts all six boxes rather than only the
  two flagged lines (77, 98), per the plan's explicit warning that the rule reports one finding
  per matched pair, not per occurrence -- converting only two would have left the finding in place.

## Deviations from Plan

None - plan executed exactly as written. The only departure from the plan's literal prose is the
`magic-textarea.tsx` file-length outcome noted above, which is a measured-vs-predicted discrepancy
in an acceptance-criteria detail, not a deviation in the work performed.

## Issues Encountered

None. `pnpm build` (typecheck + bundle) passed after every task with no errors.

## Outstanding Manual Verification (per orchestrator note 4)

This project has no test runner until plan 05-13, and both `build_command` and `test_command` in
`.planning/config.json` are `pnpm build`, which only typechecks and bundles -- it cannot exercise
runtime behavior. The following three surfaces changed executable code in this plan and were
**not** manually exercised in a running browser. Each is recorded here as an explicit OUTSTANDING
item, not assumed verified from the build passing:

1. **Autocomplete (magic-textarea.tsx)** -- OUTSTANDING. Not verified: that `MagicInput` and
   `MagicTextArea` still open their `:`/`@` trigger menus, that emoji and user-mention results
   still populate and are selectable, and that the shared `innerRef` bridging still exposes the
   underlying DOM node to callers (e.g. focus-on-mount call sites).
2. **Voice sliders (article-reader.tsx)** -- OUTSTANDING. Not verified: that the speed, pitch, and
   volume sliders still move, that each slider's value still round-trips through its own
   `handle*Change` callback into `voiceSettings`, and that the displayed label still updates live
   as each slider moves.
3. **Notification count badge (notifications/index.tsx)** -- OUTSTANDING. Not verified: that each
   of the six navigation boxes still shows the correct per-category count, that the badge still
   disappears at zero count, and that the time-range label still appears/disappears correctly as
   the selected time range changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Bucket-H `code-quality/duplicate-block` now at 4 (from 9 at plan start), all four remaining
  findings confirmed (via `filePath` in the full-repo rescan) to belong to plan 05-06's three
  files (`services/notifications/common.ts` x2, `sw/client/error-logger.ts`,
  `views/messages/chat/components/direct-message-form.tsx`), which is unblocked to proceed.
- The three OUTSTANDING manual-verification items above should be exercised together with 05-04's
  still-open background-worker spot-check once a working dev server / test harness is available
  (05-13), rather than assumed resolved by `pnpm build`.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-24*

## Self-Check: PASSED

All three modified source files and both plan artifacts (this SUMMARY.md, 05-BASELINE.md)
confirmed present on disk; all three task commit hashes (`ac63316ce`, `083fc481b`, `47d194617`)
confirmed present in `git log --oneline --all`.
