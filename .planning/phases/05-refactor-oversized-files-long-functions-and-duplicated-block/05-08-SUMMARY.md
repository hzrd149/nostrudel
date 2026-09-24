---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 08
subsystem: ui
tags: [react, react-hook-form, chakra-ui, webxdc, json-rpc, nostr-pow]

# Dependency graph
requires:
  - phase: 04-dead-code-and-import-hygiene-sweep
    provides: "The 04-13 lifecycle fixes in post-modal's mining path (two-operand mining condition, useAsyncAction draft error surface) that this plan's extraction must preserve intact"
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: "05-07's useWebxdc split, establishing the sub-hook return surface webxdc.tsx consumes (not touched by this plan)"
provides:
  - "post-modal/index.tsx's renderBody split into three module-scope components (PublishedEntryBody, MiningBody, ComposerBody), clearing its complexity/function-too-long finding by extraction"
  - "webxdc.tsx's handleRequest split into handleUpdateRequest and handleRealtimeRequest by concern, clearing its complexity/function-too-long finding by extraction"
  - "D-12's three named non-component extraction targets (use-webxdc.ts in 05-07, these two files here) are now all resolved"
affects: [05-11, 05-12, 05-14, phase-05-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-scope PascalCase JSX helper components taking a Pick of a react-hook-form UseFormReturn plus explicit callback/ref props, rather than the whole form object or a hoisted whole-account object"
    - "A single loosely-typed alias (RequestParams = any) carrying one eslint-disable comment, reused across multiple split-handler signatures, instead of repeating the suppression per signature"
    - "Boolean-returning claim-and-dispatch handlers (handleUpdateRequest/handleRealtimeRequest) tried in sequence inside one try/catch, falling through to a shared not-found error"

key-files:
  created: []
  modified:
    - src/components/post-modal/index.tsx
    - src/components/webxdc/webxdc.tsx
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md

key-decisions:
  - "post-modal's ComposerBody receives a narrow Pick<UseFormReturn<FormValues>, \"getValues\" | \"setValue\" | \"register\" | \"formState\"> rather than the full react-hook-form return object or a cast, keeping type safety without threading a dozen individual props"
  - "post-modal's uploadCtx object is not passed down; only the derived isUploading boolean is, since that is the only field ComposerBody reads"
  - "webxdc.tsx's three now-duplicated `params: any` signatures were consolidated into one RequestParams type alias carrying the file's second eslint-disable comment, keeping the suppression count at 2 (matching pre-edit) instead of growing to 4"
  - "Both webxdc.tsx split handlers stay declared inside the message-listener effect (not lifted to memoised component-body callbacks), matching the plan's discretion clause and minimizing the diff against the already-working closure-over-realtimeChannels pattern"

patterns-established:
  - "Pick<UseFormReturn<T>, ...> as the prop-object shape for form-heavy extracted JSX components, in place of prop-decomposing every individual form field"

requirements-completed: []

coverage:
  - id: D1
    description: "post-modal/index.tsx's renderBody (123 lines) is split into three module-scope components; complexity/function-too-long clears for this file by extraction, not suppression"
    verification:
      - kind: other
        ref: "scoped aislop --json rescan of src/components/post-modal/index.tsx: complexity/function-too-long findings=0; pnpm build exit 0; grep -c 'aislop-ignore' returns 1 (the one pre-existing directive, byte-identical via git diff, not a new one)"
        status: pass
    human_judgment: true
    rationale: "pnpm build only typechecks/bundles; no test runner exists until 05-13. The extraction cannot be proven not to regress publishing, PoW mining, or composer dismissal without exercising the app in a browser. Routed to follow-up UAT."
  - id: D2
    description: "webxdc.tsx's handleRequest (102 lines) is split into handleUpdateRequest and handleRealtimeRequest by concern, both still declared inside the component and covering all eight methods; the outer frame-input guards and error codes are unchanged"
    verification:
      - kind: other
        ref: "scoped aislop --json rescan of src/components/webxdc/webxdc.tsx: complexity/function-too-long findings=0; pnpm build exit 0; grep confirms all eight method cases, the three outer guards (origin/source/protocol), and both error codes (-32601, -1) present"
        status: pass
    human_judgment: true
    rationale: "No test runner and no running webxdc frame/mini-app in this session. A grep can prove every guard/method/error-code string still exists in source but cannot prove a live frame's request actually dispatches correctly through the split handlers. Routed to follow-up UAT."

duration: ~20min
completed: 2026-09-24
status: complete
---

# Phase 05 Plan 08: Extract post-modal's body renderer and webxdc's request handler (D-12)

**The post modal's 123-line body renderer becomes three module-scope components (published-entry, mining, composer) and the webxdc frame's 102-line request handler splits into an update-stream handler and a realtime-channel handler — the last two of D-12's three named non-component extraction targets, with the two-operand mining condition and every frame-input guard confirmed unchanged.**

## Performance

- **Duration:** ~20min
- **Completed:** 2026-09-24
- **Tasks:** 2
- **Files modified:** 3 (2 source files + 05-BASELINE.md)

## Accomplishments

- **`src/components/post-modal/index.tsx`'s `renderBody` (123 lines, over the 80-line plain-function budget) split into three module-scope components** — `PublishedEntryBody` (the publish-log entry + close handler), `MiningBody` (draft, target difficulty, cancel/skip/complete callbacks), and `ComposerBody` (the large composer arm). All three are declared at module scope (column zero), not inside `PostModalInner`'s body, so none is remounted on every keystroke — the one hard constraint the plan called out as a real regression risk. The dispatcher collapses to a single ternary computed once per render at the modal's one call site, replacing the named `renderBody()` function.
- **The 04-13 mining lifecycle fix confirmed intact.** The mining branch's `miningTarget && draft` condition is unchanged — both operands are still tested in the extracted ternary, verified by direct grep and by reading the diff. Clearing only one operand here would have reintroduced the endless re-mine/re-publish loop that 04-13 fixed; this was not done.
- **`ComposerBody` receives a narrow `Pick<UseFormReturn<FormValues>, "getValues" | "setValue" | "register" | "formState">`** rather than the whole react-hook-form return object, an `any`-typed cast, or a dozen individually-decomposed form-field props. `uploadCtx` itself is not threaded down — only its derived `isUploading` boolean is, since that is the only field the composer body reads.
- **`src/components/webxdc/webxdc.tsx`'s `handleRequest` (102 lines) split into `handleUpdateRequest`** (sendUpdate, setUpdateListener, getAllUpdates, sendToChat, importFiles) **and `handleRealtimeRequest`** (joinRealtimeChannel, realtimeChannel.send, realtimeChannel.leave), each returning a claimed boolean. `handleRequest` tries the update handler, then the realtime handler, falling through to the `-32601` method-not-found error when neither claims the method — all three calls still inside the one `try/catch` that converts a thrown error into the `-1` error response, confirmed to still cover all eight methods.
- **Both webxdc handlers stay declared inside the message-listener effect**, not hoisted to module scope, since `handleRealtimeRequest` closes over `realtimeChannels` — the channel-map ref declared textually after this effect but already assigned by the time the effect body runs post-render (the same closure relationship the original unsplit code already relied on).
- **The outer frame-input guards are unchanged**: the origin equality check, the source-window check, and the protocol-version check are all still present, unmoved, before any method dispatch — confirmed by grep at their original line numbers (shifted only by the type-alias insertion above them).
- **The file's loosely-typed JSON-RPC params parameter consolidated into one `RequestParams = any` type alias**, carrying the file's second `eslint-disable-next-line @typescript-eslint/no-explicit-any` comment once and reused by all three split-handler signatures, instead of growing the suppression count from 2 to 4 by repeating it per signature.
- **Measured, not assumed: `complexity/function-too-long` fell 4 → 2 whole-repo (-2), bucket-H total 6 → 4**, via a live full-repo `aislop --json` rescan. This closes all three of D-12's named non-component extraction targets (`use-webxdc.ts` in 05-07, these two files here); the two findings remaining after this plan both live in `src/providers/global/napplet-shell-provider.tsx` (owned by 05-11/05-12), confirmed via the rescan's `filePath` field.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract the post modal's body branches (D-12)** - `6c5e34eeb` (refactor)
2. **Task 2: Split the webxdc frame's request dispatch by concern (D-12)** - `729845311` (refactor)

**Plan metadata:** `dd370655b` (docs: record measured after-counts in 05-BASELINE.md)

## Files Created/Modified

- `src/components/post-modal/index.tsx` - `renderBody`'s three branches extracted to module-scope `PublishedEntryBody`/`MiningBody`/`ComposerBody`; dispatcher collapsed to a ternary at the single call site
- `src/components/webxdc/webxdc.tsx` - `handleRequest`'s switch split into `handleUpdateRequest`/`handleRealtimeRequest`, tried in sequence inside one try/catch; new `RequestParams` type alias added
- `.planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md` - D-19 per-rule table updated (function-too-long 4→2, total 6→4) plus a new resolution section detailing both extractions

## Decisions Made

- `ComposerBody`'s form prop is a `Pick` of `UseFormReturn<FormValues>` (getValues/setValue/register/formState) rather than the whole object or a cast, per D-12's discretion clause on exact prop decomposition — this keeps full type safety without threading a dozen individual form-field props.
- `uploadCtx` itself is not passed to `ComposerBody`; only the derived `isUploading` boolean is, since that is the only field the composer body actually reads (`uploadCtx?.isUploading`).
- The webxdc split's three duplicated `params: any` signatures were consolidated into one `RequestParams = any` type alias carrying a single suppression comment, rather than three separate `any` literals each needing its own `eslint-disable-next-line` — keeps the file's suppression-comment count at 2 (unchanged from before this plan) instead of growing it to 4.
- Both webxdc handlers were kept declared inside the message-listener effect (the plan's first-listed option) rather than lifted to memoised component-body callbacks, since it produces the smaller diff against the already-working closure-over-`realtimeChannels` pattern and needed no new dependency-array reasoning.

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched the plan's action text and acceptance criteria without needing a Rule 1-4 fix.

### Notes on gate mechanics (not deviations from the plan's substance)

**1. Task 1's literal `aislop-ignore` grep count is 1, not the plan's stated 0.** The plan's acceptance criterion `grep -c 'aislop-ignore' src/components/post-modal/index.tsx returns 0` predates a pre-existing directive already present in the file before this plan ran (`aislop-ignore-next-line eslint/no-unused-expressions` on the `formState.isDirty` read, unrelated to `renderBody` and not touched by this plan's edit). Confirmed via `git diff` that no hunk touches that line and no new directive was added — this is a plan-documentation gap (the plan's authors likely meant "no *new* ignore directive," matching every other plan in this phase's acceptance-criteria wording), not a code issue. The actual bar — no ignore added to suppress either targeted finding — is satisfied.

**2. Six pre-existing findings surfaced in `webxdc.tsx` post-edit, none swept.** Five `ai-slop/narrative-comment` decorative-separator warnings, one `ai-slop/hardcoded-url` on the `https://${id}.webxdc.app` origin construction, and one `ai-slop/unsafe-type-assertion` on the outer listener's `event.data as any` — all confirmed via line-number tracking against the pre-edit file to predate this plan's edit (only shifted by the type-alias insertion). Left untouched per the out-of-scope rule and this plan's own explicit prohibition against sweeping backlog 999.2/999.5/999.8 findings in these two files.

**Total deviations:** 0 auto-fixed. Both notes above are gate-mechanics/documentation observations, not deviations from the plan's intended substance.
**Impact on plan:** None. Both extractions match the plan's action sections and threat-model mitigations verbatim.

## Issues Encountered

None.

## Static Verification Performed (what was actually proven)

- `pnpm build` (`tsc --project tsconfig.json && vite build`, plus the service-worker build) exited 0 after every task.
- Scoped `aislop --json` rescans of each targeted file individually confirmed `complexity/function-too-long` at 0, immediately after each task's edit.
- Live full-repo `aislop --json` rescan after both tasks confirmed the plan's predicted 2-row reduction exactly (`complexity/function-too-long` 4 → 2, bucket-H total 6 → 4), with the two remaining findings' `filePath` confirmed to belong to `napplet-shell-provider.tsx` (05-11/05-12), not these two files.
- Export counts confirmed unchanged via `git show HEAD~N:<file> | grep -c '^export'` vs. the post-edit count: `post-modal/index.tsx` 2 → 2, `webxdc.tsx` 4 → 4.
- The mining branch's `miningTarget && draft` two-operand condition confirmed present via grep and via reading the extracted ternary directly.
- All eight webxdc methods, the three outer frame-input guards (origin/source-window/protocol-version), and both error codes (`-32601` method-not-found, `-1` generic failure) confirmed present via grep after the split.
- `webxdc.tsx`'s `eslint-disable-next-line @typescript-eslint/no-explicit-any` comment count confirmed unchanged at 2 (`git show HEAD~1:... | grep -c` vs. post-edit `grep -c`).
- No `aislop-ignore` directive added to `webxdc.tsx` (0 before, 0 after). `post-modal/index.tsx`'s single pre-existing directive confirmed byte-identical via `git diff` (0 hunks touch it).

## Human-Only Verification — Outstanding

**This project has no test runner (no vitest/jest/playwright in package.json). Both `build_command`/`test_command` in `.planning/config.json` are `pnpm build`, a typecheck+bundle only. `pnpm dev` was NOT run in this session.** The following are recorded as `unverified`, not assumed from the passing build:

1. **`unverified` — post-modal composer still posts a plain (non-PoW) note.** Open the composer, type content, click Post with difficulty 0. The publish-log entry screen should render and the note should appear on relays.
2. **`unverified` — post-modal PoW mining still mines and publishes exactly once.** Set a non-zero difficulty, submit, let mining complete, confirm exactly one publish and no re-mine loop.
3. **`unverified` — dismissing the composer mid-mine still cancels cleanly.** Start a mine, dismiss via ESC/overlay/Cancel before completion, confirm no note is published and the worker pool is torn down (carries forward the same unverified surface from 04-13, now additionally routed through the extracted `MiningBody`/`ComposerBody`).
4. **`unverified` — a webxdc mini-app's requests still dispatch correctly through the split handlers.** Load a hosted webxdc mini-app that calls `sendUpdate`, `setUpdateListener`, `getAllUpdates`, `sendToChat`, `importFiles`, `joinRealtimeChannel`, `realtimeChannel.send`, and `realtimeChannel.leave`; confirm each still resolves/updates as before the split, and that an unknown method still returns the method-not-found error.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- D-12's three named non-component extraction targets are all resolved (`use-webxdc.ts` in 05-07, `post-modal/index.tsx` and `webxdc.tsx` here). `complexity/function-too-long`'s only two remaining findings are both in `napplet-shell-provider.tsx`, owned by 05-11/05-12's D-08 split.
- `complexity/file-too-large` remains untouched at 2 (`napplet-shell-provider.tsx`, `wallets.ts`), owned by 05-09 through 05-12 — bucket-H's only remaining rule with findings, at 4 total.
- Four runtime claims (plain post, PoW mine-and-publish, mid-mine dismissal, webxdc request dispatch) are outstanding and should be exercised in the phase's follow-up UAT round — see Human-Only Verification above.
- No new dependency, no new test infrastructure, and no dev-server run occurred in this session.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-24*
