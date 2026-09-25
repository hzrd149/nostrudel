---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 12
subsystem: napplet-shell
tags: [refactor, napplet, consent, modal, react, component-extraction]

requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: "a thinned napplet-shell-provider.tsx (274 lines) importing five service modules, its last bucket-H finding being NappletShellProvider's 195-line function-too-long (05-11)"
provides:
  - "src/components/napplets/consent-modal.tsx — the grant-access modal (default export NappletConsentModal), driven entirely by props"
  - "src/components/napplets/intent-choice-modal.tsx — the choose-a-napplet modal (default export NappletIntentChoiceModal), driven entirely by props"
  - "a thinned napplet-shell-provider.tsx (274 -> 198 lines) carrying no bucket-H finding, exporting exactly NappletShellProvider and useNappletShell"
affects: [05-13-plan, 05-14-plan]

tech-stack:
  added: []
  patterns:
    - "A component extracted out of a provider to break a function-too-long finding takes every value it needs as an explicit prop rather than importing the provider's hook, since the provider renders the component and a hook import back would close an import cycle (D-08/D-09 completion, same shape 05-10/05-11 used for the sibling service extractions)"
    - "When a plan's own action text folds the necessary non-literal adjustment (closure reads becoming props) into the move commit itself rather than naming it as a follow-on step, the single commit documents that deviation inline in its message instead of manufacturing a second commit to satisfy D-16's letter over its intent"

key-files:
  created:
    - src/components/napplets/consent-modal.tsx
    - src/components/napplets/intent-choice-modal.tsx
  modified:
    - src/providers/global/napplet-shell-provider.tsx

key-decisions:
  - "Task 1 landed as one commit, not a move-then-adjust pair — the plan's own <action> text for this task explicitly folds the props-threading into the move ('what changes is that values previously read from the enclosing scope arrive as props... say so in the commit message'), unlike 05-11's createResourceService division which was a genuine post-move internal restructuring. The commit message documents the one non-byte-identical change inline."
  - "Each modal defines its own minimal local prop type (NappletConsentRequest: event+capabilities; NappletIntentChoiceRequest: archetype+action) rather than importing the provider's internal ConsentRequest/IntentChoiceRequest types, which also carry identity/resolve fields the modals never use. Passing the provider's state variables (typed with the fuller internal types) into props typed with the narrower local shape works via TypeScript's structural typing for variable (non-literal) assignments, so no type export was added to the provider and its export surface stays exactly the two functions."

requirements-completed: []

coverage:
  - id: D1
    description: "Consent modal and intent-choice modal moved into their own components under components/napplets/, beside the existing frame/menu/info-drawer napplet UI (D-09), each a default export with an explicit prop type"
    verification:
      - kind: other
        ref: "ls confirms both files exist; grep confirms both are default exports; grep 'from \"~/' returns 0 (no path alias); pnpm build exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Provider is left thin (state, callbacks, modal rendering only), clearing both of its remaining bucket-H findings without an ignore (D-08, D-12)"
    verification:
      - kind: other
        ref: "scoped rescan filtered to napplet-shell-provider.tsx returns 0 across all four bucket-H rules; grep 'aislop-ignore' returns 0; file shrank 274 -> 198 lines; export surface confirmed unchanged (grep '^export' shows exactly NappletShellProvider and useNappletShell)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Neither modal imports the shell hook or the provider (no import cycle); every value each modal needs arrives as an explicit prop"
    verification:
      - kind: other
        ref: "grep -c 'useNappletShell' returns 0 for both new files; grep -rn 'napplet-shell-provider' src/components/napplets/ matches only the pre-existing, unmoved napplet-frame.tsx import"
        status: pass
    human_judgment: false
  - id: D4
    description: "All three consent outcomes (deny/allow-once/always-allow) and both dismissal paths (consent modal close, intent-choice modal close/cancel) preserved exactly, with the same function calls and arguments as before the move"
    verification:
      - kind: other
        ref: "direct read of the provider's respond/respondIntentChoice callbacks (unmoved, still declared in the provider) confirms revokeCapabilities/grantCapabilities/addAlwaysAllowed call sites and arguments are byte-identical to the pre-move code; the three consent buttons and both close handlers in the new modal files call onRespond with the same argument shapes the provider's pre-move onClick handlers used"
        status: pass
    human_judgment: false
  - id: D5
    description: "The consent prompt actually appearing, deny actually revoking, allow-once not persisting, always-allow persisting across a reload, dismissal actually behaving as deny, and the intent-choice modal actually routing to the chosen handler, all exercised in a running app"
    verification: []
    human_judgment: true
    rationale: "No test runner exists until plan 05-13 and both build_command/test_command are pnpm build (typecheck+bundle only); none of these security-relevant behavioural surfaces were exercised in a live browser session in this turn"

duration: ~20min
completed: 2026-09-25
status: complete
---

# Phase 5 Plan 12: Napplet Shell Consent/Intent-Choice Modal Extraction Summary

**Consent modal and intent-choice modal moved out of the napplet shell provider into their own prop-driven components under `components/napplets/`, thinning the provider from 274 to 198 lines and clearing the last bucket-H finding in the entire 33-row phase baseline.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-09-25
- **Tasks:** 2/2 completed (2 commits: 1 for the modal extraction, 1 for the BASELINE.md update)
- **Files modified:** 3 (1 modified, 2 created)

## Accomplishments
- Created `src/components/napplets/consent-modal.tsx` (68 lines) — the grant-access dialogue, default-exported as `NappletConsentModal`, taking `{ consent, onRespond }` as its explicit prop type. Renders the app title in a `Code` span, the access-duration sentence, the requested-capability list, and the three buttons (deny, allow once, always allow) exactly as before.
- Created `src/components/napplets/intent-choice-modal.tsx` (59 lines) — the choose-a-napplet dialogue, default-exported as `NappletIntentChoiceModal`, taking `{ intentChoice, installedNapplets, onRespond }`. Renders the archetype/action sentence, the installed-napplet button list, and the cancel button exactly as before.
- Thinned `napplet-shell-provider.tsx` from 274 to 198 lines: removed the two inline `<Modal>` JSX blocks and the now-unused Chakra modal imports (`Modal`, `ModalBody`, `ModalContent`, `ModalFooter`, `ModalHeader`, `ModalOverlay`, `Stack`, `Text`, `UnorderedList`, `ListItem`, `Code`, `Button`, `ButtonGroup`) and `getNappletTitle` import; the provider now renders `<NappletConsentModal consent={consent} onRespond={respond} />` and `<NappletIntentChoiceModal intentChoice={intentChoice} installedNapplets={installedNapplets} onRespond={respondIntentChoice} />`.
- Live rescan confirms bucket-H fell 1 → 0 (`complexity/function-too-long` cleared): the whole 33-row Phase 5 bucket-H baseline is now fully closed, repo-wide bucket-H total 0, repo score unchanged at 85/100.
- No import cycle introduced: neither new modal imports `useNappletShell` or the provider (`grep -c 'useNappletShell'` returns 0 for both files); the only `napplet-shell-provider` reference remaining under `src/components/napplets/` is the pre-existing, unmoved `napplet-frame.tsx` import.
- Provider's export surface confirmed unchanged (`NappletShellProvider`, `useNappletShell` — exactly as before); all three consumer sites (`src/providers/global/index.tsx`, `src/views/napplets/napplet.tsx`, `src/components/napplets/napplet-frame.tsx`) confirmed unedited via `git diff --name-only`.
- `permissions.ts`'s two maps (`approvedCapabilities`, `windowIdentities`) remain module-private; no map export was added by this plan.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract the two modals into components/napplets (D-09, D-16)** - `2857aad05` (refactor)
2. **Task 2: Confirm the thinned provider clears both of its findings (D-08, D-12, D-19)** - `eac8d256b` (docs — BASELINE.md update; no code change was needed since the rescan already returned 0)

## Files Created/Modified
- `src/components/napplets/consent-modal.tsx` - the grant-access modal, default export, explicit prop type, no import of the shell hook
- `src/components/napplets/intent-choice-modal.tsx` - the choose-a-napplet modal, default export, explicit prop type, no import of the shell hook
- `src/providers/global/napplet-shell-provider.tsx` - modal JSX removed, now renders the two new components; unused Chakra/helper imports removed

## Decisions Made
- Landed Task 1 as a single move commit rather than a move-then-adjust pair. Unlike 05-11's `createResourceService` division (a genuine post-move internal restructuring, correctly split into two commits per D-16), this plan's own `<action>` text for Task 1 explicitly folds the props-threading into the move itself ("the markup moves verbatim; what changes is that values previously read from the enclosing scope arrive as props... say so in the commit message, since that makes it not strictly byte-identical"). Manufacturing a second commit here would satisfy D-16's letter while contradicting the plan's own instruction for this specific task; the single commit's message documents the one non-literal-byte-identical change inline instead.
- Each modal defines its own minimal local prop type rather than importing the provider's internal `ConsentRequest`/`IntentChoiceRequest` types (which also carry `identity`/`resolve`, unused by either modal). `NappletConsentRequest` is `{ event, capabilities }`; `NappletIntentChoiceRequest` is `{ archetype, action }`. Passing the provider's fuller-typed state variables into these narrower prop types works via TypeScript's structural typing for variable (non-literal-object) assignments — confirmed by `pnpm build` passing with no type error — so no type needed to be exported from the provider, keeping its export surface at exactly the two functions.

## Deviations from Plan

None beyond the two Decisions above, both of which resolve in favor of the plan's own more specific instructions (Task 1's action text; the export-surface constraint) over a more generic reading — recorded per Rule "genuinely unsure -> ask," resolved without needing to stop, since both were unambiguous once the plan's own text and the D-16/export-surface constraints were read together.

## Issues Encountered

None. `pnpm build` (typecheck + bundle) exited 0 after the code commit; the aislop hook reported 0 findings on every edit to the two new files and the final state of the provider edit.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. Both modals are fully wired to real provider state and callbacks; no placeholder or hardcoded-empty rendering was introduced.

## Threat Flags

None. This plan relocates existing consent-UI markup into new files under an established UI directory; it introduces no new network endpoint, auth path, file-access pattern, or schema change at a trust boundary. The threat model's four registered threats (T-05-45 through T-05-48) are all `mitigate`/`accept` dispositions already covered by the verification above (dismissal fail-closed, buttons not merged, title rendering untouched, no import cycle).

## Next Phase Readiness

`src/providers/global/napplet-shell-provider.tsx` now carries 0 bucket-H findings, closing all three of its original rows (file-too-large, and both function-too-long findings) — the full 33-row Phase 5 bucket-H baseline established in `05-BASELINE.md` is now at 0 repo-wide. Plan 05-13 (the vitest harness / unit tests on the extracted permission logic, per this plan's own `<verification>` note) can proceed without any further structural change to the napplet shell.

**OUTSTANDING manual-verification items (no test runner exists until 05-13; `pnpm build` only typechecks/bundles):**
- The consent prompt actually appearing in the UI when a napplet requests capabilities it hasn't been granted.
- The deny button actually revoking a previously-granted capability set on the next request.
- The allow-once grant not surviving a frame reload (session-only).
- The always-allow grant persisting across a reload and correctly suppressing the prompt on the next request.
- A dismissal (ESC key, overlay click, or the modal's close affordance) actually behaving as a deny rather than silently granting.
- The intent-choice modal actually routing the user's chosen napplet back to the pending intent's resolver, and the cancel path actually resolving with no handler.

None of the above were exercised in a live browser session in this turn; they are recorded here as explicit outstanding items, not assumed verified from the passing build. Per this plan's own `<verification>` note, an optional visual spot-check is reasonable but not planned as a blocking task, and no phase in this project carries a UI specification against which to gate one.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-25*

## Self-Check: PASSED

- FOUND: src/components/napplets/consent-modal.tsx
- FOUND: src/components/napplets/intent-choice-modal.tsx
- FOUND: src/providers/global/napplet-shell-provider.tsx
- FOUND commit: 2857aad05
- FOUND commit: eac8d256b
