---
phase: 04-dead-code-and-import-hygiene-sweep
plan: 08
subsystem: code-quality
tags: [eslint, ai-slop, react, pow, content-transform]

requires:
  - phase: 03-swallowed-exception-remediation
    provides: the in-catch `return false;` sites this plan's D-13 cleanup depends on to identify the redundant trailing return
provides:
  - PoW miner's own-run worker teardown wired up (bare `cleanup;` fixed to `cleanup();`)
  - Two short-circuit-statement sites converted to plain `if` control flow
  - gallery.tsx's three unused render-callback/prop parameters resolved
  - Three Phase-3-stranded unreachable trailing returns deleted
affects: [04-11-VALIDATION-ledger, 04-VALIDATION.md manual verification row for mine-pow.tsx]

tech-stack:
  added: []
  patterns:
    - "Object-destructured third-party callback props: drop unused keys from the destructure pattern entirely rather than underscore-prefixing (no positional meaning to preserve, unlike array-destructured callbacks)"

key-files:
  created: []
  modified:
    - src/components/pow/mine-pow.tsx
    - src/components/content/components/gallery.tsx
    - src/components/content/links/image.tsx
    - src/components/content/transform/nip-notation.ts
    - src/components/content/transform/bip-notation.ts
    - src/helpers/nostr/goal.ts

key-decisions:
  - "D-12 resolved as a call (`cleanup();`), not a deletion: `cleanup` and `stopMiner()` tear down two different worker sets (this run vs. the previous run), and `cleanup` is out of its TDZ by the time the async `onmessage` callback can reach it."
  - "The no-Web-Workers branch's empty `() => {}` cleanup was resolved with an in-body explanatory comment (no rule-scoped ignore needed) — the comment must sit inside the arrow function's braces, not on the line above the `return`, for ai-slop/empty-function to clear."
  - "gallery.tsx's `event` param on ImageGallery deleted outright (both call sites pass only `images`); renderPhoto's `photo`/`wrapperStyle` dropped from the destructure entirely rather than underscore-prefixed, since react-photo-album's RenderPhotoProps is a named object contract with no positional meaning to preserve."

requirements-completed: [D-06, D-12, D-12a, D-13]

coverage:
  - id: D1
    description: "Bare `cleanup;` reference in mine-pow.tsx becomes a real `cleanup();` call, stale copy-pasted comment corrected"
    requirement: "D-12"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq filter on mine-pow.tsx for eslint/no-unused-expressions + ai-slop/empty-function"
        status: pass
    human_judgment: true
    rationale: "This changes runtime worker teardown behavior. The plan's own acceptance criteria mark this the one site in the phase with a manual verification row in 04-VALIDATION.md (dev-server spot-check), deliberately deferred to phase verification rather than attempted here."
  - id: D2
    description: "Two short-circuit-expression statements rewritten as plain `if` statements (gallery.tsx:24, image.tsx:67), guard conditions preserved exactly"
    requirement: "D-12a"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq filter for eslint/no-unused-expressions on both files; grep isPropagationStopped presence"
        status: pass
    human_judgment: false
  - id: D3
    description: "gallery.tsx's three unused parameters (event, photo, wrapperStyle) resolved without changing rendered output"
    requirement: "D-06"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq filter for eslint/no-unused-vars Parameter findings on gallery.tsx; pnpm build (typecheck)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Three Phase-3-stranded trailing `return false;` statements deleted after try/catch, in-catch returns preserved"
    requirement: "D-13"
    verification:
      - kind: unit
        ref: "pnpm exec aislop scan --json . | jq filter for eslint/no-unreachable (0) and ai-slop/swallowed-exception (0) across the three files"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-16
status: complete
---

# Phase 04 Plan 08: Behaviour-affecting one-offs Summary

**PoW miner now calls its own cleanup on completion, two short-circuit statements read as ordinary `if` control flow, and the three trailing returns Phase 3 stranded after its swallowed-exception fixes are gone.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `src/components/pow/mine-pow.tsx:47`'s bare `cleanup;` identifier reference (a bug — a copy-pasted comment sat over a statement that referenced but never called `cleanup`) is now `cleanup();`, correctly terminating the current mining run's Web Workers. The stale comment ("Call stopMiner when mining is complete", copy-pasted from the line above) is corrected to describe what the call actually does.
- The no-Web-Workers branch's `() => {}` no-op cleanup gained an in-body explanatory comment, clearing `ai-slop/empty-function` without a rule-scoped ignore — no fifth ledger row needed for 04-11.
- `gallery.tsx:24` and `image.tsx:67`'s `!e.isPropagationStopped() && show();` short-circuit statements are now `if (!e.isPropagationStopped()) show();` — pure shape change, guard and negation unchanged.
- `gallery.tsx`'s three unused parameters resolved: `ImageGallery`'s trailing `event` param deleted (no caller passes it; its now-orphaned `NostrEvent` import removed too), and `renderPhoto`'s unused `photo`/`wrapperStyle` dropped from the destructure pattern (react-photo-album's `RenderPhotoProps` is a named object contract, so omitting unused keys is safe and needs no underscore prefix).
- `nip-notation.ts:47`, `bip-notation.ts:47`, and `goal.ts:109`'s redundant trailing `return false;` statements (made unreachable by Phase 3's `b188fe526`, which added an in-catch `return false;` above them) are deleted. The in-catch returns — the ones satisfying `ai-slop/swallowed-exception` — are untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make the PoW cleanup a real call and resolve the no-op cleanup stub** - `34e085a60` (fix)
2. **Task 2: Convert both short-circuit statements and resolve gallery's unused parameters** - `38e5fe1b2` (refactor)
3. **Task 3: Delete the three trailing returns Phase 3 made unreachable** - `dfb917453` (fix)

_Plan metadata commit made separately per worktree-mode convention (SUMMARY.md/REQUIREMENTS.md only; STATE.md/ROADMAP.md owned by the orchestrator)._

## Files Created/Modified

- `src/components/pow/mine-pow.tsx` - bare `cleanup;` → `cleanup();`, comment corrected, no-op cleanup explained
- `src/components/content/components/gallery.tsx` - short-circuit → `if`; `event` param and `NostrEvent` import deleted; `photo`/`wrapperStyle` dropped from renderPhoto destructure
- `src/components/content/links/image.tsx` - short-circuit → `if`
- `src/components/content/transform/nip-notation.ts` - redundant trailing `return false;` deleted
- `src/components/content/transform/bip-notation.ts` - redundant trailing `return false;` deleted
- `src/helpers/nostr/goal.ts` - redundant trailing `return false;` deleted

## Decisions Made

- D-12 resolved as a call, not a deletion — see key-decisions in frontmatter for the full rationale (distinct worker sets, no TDZ hazard).
- The no-op cleanup's empty-function finding was resolved with an in-body comment rather than a rule-scoped ignore; this required moving the comment from above the `return` statement into the arrow function's own body — a comment sitting outside the function did not satisfy `ai-slop/empty-function` on the first attempt (see Issues Encountered).
- gallery.tsx's `event` param deleted outright rather than underscore-prefixed, since both call sites (`content/index.tsx`, `timeline-page/media-timeline/index.tsx`) pass only `images` — confirmed via grep before deleting, per the plan's "read each call site before choosing" instruction.
- `photo`/`wrapperStyle` in `renderPhoto` dropped from the object-destructure pattern instead of underscore-prefixed. This differs from D-06's positional-array-callback example (`(item, index) =>`) in 04-PATTERNS.md: `renderPhoto` receives a single named-property object from react-photo-album, so property order carries no meaning and omitting unused keys is the idiomatic fix — no underscore convention needed here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Empty-function comment placement required a second edit**
- **Found during:** Task 1
- **Issue:** The plan's action said to give "the arrow body a short explanatory comment." The first attempt placed the comment on the line immediately above the `return () => {};` statement (i.e., outside the arrow function). The aislop hook still reported `ai-slop/empty-function` on that line afterward — the rule checks the function's own body, not a preceding comment.
- **Fix:** Moved the explanatory comment inside the arrow function's braces (`() => { // Intentionally empty... }`). The hook then reported 0 findings.
- **Files modified:** `src/components/pow/mine-pow.tsx`
- **Verification:** Post-edit hook feedback and the plan's own jq acceptance command both returned 0.
- **Committed in:** `34e085a60` (Task 1 commit — the corrected version is what was committed; the intermediate placement was never committed)

**2. [Rule 1 - Bug] Cascading unused-import after deleting `event` param**
- **Found during:** Task 2
- **Issue:** Deleting `ImageGallery`'s `event` parameter left the `NostrEvent` import (line 4 of `gallery.tsx`) unused — flagged by the post-edit hook as `ai-slop/unused-import`.
- **Fix:** Removed the now-unused `import { NostrEvent } from "nostr-tools";` line.
- **Files modified:** `src/components/content/components/gallery.tsx`
- **Verification:** Post-edit hook returned 0 findings after the import removal.
- **Committed in:** `38e5fe1b2` (Task 2 commit)

**3. [Rule 3 - Blocking, verification-only] Task 2 and Task 3's provided jq verify commands errored on this jq version**
- **Found during:** Task 2 and Task 3 verification
- **Issue:** Both tasks' `<verify><automated>` commands use `select([...]|index(.filePath))` to test file-path membership. On the jq version installed here (jq 1.7-family), `.filePath` inside `index(.filePath)` is evaluated against the piped-in array literal (`["a","b"]`), not the diagnostic object — `jq: error: Cannot index array with string "filePath"`, exit code 5. This is a verify-script bug in the plan text itself, not a source-code issue.
- **Fix:** Ran the semantically equivalent corrected form (`select(.filePath as $f | [...]|index($f))`) to actually check the acceptance criterion. Both returned the plan's expected `0`.
- **Files modified:** None (verification-only; no plan or source file was altered)
- **Verification:** Corrected jq query output matched the plan's stated expected value (`0`) for both tasks.
- **Committed in:** N/A — not a source change

---

**Total deviations:** 3 auto-fixed (2 Rule 1 cascading-bug fixes, 1 Rule 3 verify-command correction). None expanded scope beyond the plan's stated files or behavior.
**Impact on plan:** All three necessary to actually satisfy the plan's own acceptance criteria; no scope creep.

## Issues Encountered

- `grep -c "isPropagationStopped" src/components/content/links/image.tsx` returns `2`, not the `1` the plan's acceptance criteria state. This is a pre-existing plan-measurement gap, not a regression: `image.tsx`'s `TrustImage` component (lines 25-33) has its own independent `!e.isPropagationStopped()` check at line 28, unrelated to and untouched by the `EmbeddedImage` handler edited in this task. Confirmed via direct read of both call sites before and after the edit — the edited guard (the one the acceptance criterion cares about, "the guard survived rather than being deleted") is present and correct; the count is just higher than documented because of the second, pre-existing occurrence. Left as-is, out of scope for this cleanup plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three behavior-affecting sites in Phase 4 are resolved; the remainder of the phase's work is shape-only (dead code, import hygiene) with no further runtime-behavior changes expected.
- One manual verification item remains open per the plan's own design: `mine-pow.tsx`'s `cleanup()` fix needs a dev-server spot-check of miner teardown, deliberately deferred to phase-level verification (04-VALIDATION.md already carries this as a recorded manual row).
- `eslint/no-unreachable` now sits at 6 whole-repo (down from 9), all six being the sqlite guarded block that plan 04-07 ignores rather than deletes — no further D-13-shaped work remains.

---
*Phase: 04-dead-code-and-import-hygiene-sweep*
*Completed: 2026-09-16*

## Self-Check: PASSED

- FOUND: `src/components/pow/mine-pow.tsx` (modified, committed in `34e085a60`)
- FOUND: `src/components/content/components/gallery.tsx` (modified, committed in `38e5fe1b2`)
- FOUND: `src/components/content/links/image.tsx` (modified, committed in `38e5fe1b2`)
- FOUND: `src/components/content/transform/nip-notation.ts` (modified, committed in `dfb917453`)
- FOUND: `src/components/content/transform/bip-notation.ts` (modified, committed in `dfb917453`)
- FOUND: `src/helpers/nostr/goal.ts` (modified, committed in `dfb917453`)
- FOUND: commit `34e085a60`
- FOUND: commit `38e5fe1b2`
- FOUND: commit `dfb917453`
- FOUND: commit `7117e324d` (this SUMMARY.md)
