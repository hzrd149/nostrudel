---
phase: 260829-n9x
plan: 01
subsystem: ui
tags: [signin, chakra-ui, copy, window.prompt]

requires: []
provides:
  - "nsec-branch signin prompt reworded to explicit creation copy (create/scoped-to-browser/needed-later/empty-means-unencrypted)"
  - "ncryptsec-branch signin prompt reworded to explicit re-entry copy, contrasting with the nsec prompt"
affects: [signin, accounts]

actuals:
  tokens: 310
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/views/signin/nsec.tsx

key-decisions:
  - "Kept the two later-session/migration re-entry prompts (accounts.ts, migrate-to-device.tsx) byte-identical, verified by exact-literal greps in the automated verify commands"
  - "Did not claim the password itself is stored locally in the new copy (only the encrypted key is persisted) to avoid introducing a false statement"

patterns-established: []

requirements-completed: [GH-356]

coverage:
  - id: D1
    description: "nsec signin prompt reads as creating a new local password (states creation, browser scope, future need, and empty-input consequence)"
    requirement: "GH-356"
    verification:
      - kind: unit
        ref: "grep -c 'Create a new password to encrypt your secret key in this browser' src/views/signin/nsec.tsx == 1"
        status: pass
      - kind: unit
        ref: "tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: true
    rationale: "Copy legibility/tone at the exact moment of key handling is a subjective UX judgment that automated grep/typecheck cannot fully confirm; plan's <human-check> calls for a manual signin smoke test."
  - id: D2
    description: "ncryptsec signin prompt reads as entering an existing password, visibly distinct from the nsec creation prompt on the same screen"
    requirement: "GH-356"
    verification:
      - kind: unit
        ref: "grep -c 'Enter the existing password for this encrypted key (ncryptsec)' src/views/signin/nsec.tsx == 1"
        status: pass
      - kind: unit
        ref: "tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: true
    rationale: "Visual/perceptual contrast between the two dialogs on the same screen is a subjective UX judgment; plan's <human-check> calls for a manual signin smoke test."

duration: 10min
completed: 2026-08-29
status: complete
---

# Quick Task 260829-n9x: Clarify local encryption password prompts on signin Summary

**Reworded the nsec-branch signin `window.prompt` to explicit creation copy and the ncryptsec-branch prompt to explicit re-entry copy, closing GH-356's ambiguity between "invent a password now" and "recall an existing one."**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments
- The nsec branch prompt now reads: "Create a new password to encrypt your secret key in this browser. You will need it to unlock your account later. Leave empty to store the key unencrypted." — states creation intent, local-browser scope, future need, and the empty-input consequence, all without claiming the password itself is stored.
- The ncryptsec branch prompt now reads: "Enter the existing password for this encrypted key (ncryptsec)" — explicit recall wording that contrasts with the nsec prompt on the same screen.
- Verified the two later-session/migration re-entry prompts (`src/services/accounts.ts` `PasswordAccount.requestUnlockPassword`, `migrate-to-device.tsx`) remain byte-identical to before this change.
- Zero behavioral, cryptographic, or control-flow changes: `setPassword`, `decrypt`, `PasswordAccount`/`SimpleAccount` construction, and all four `window.prompt` call sites are unchanged except the two target string literals.

## Task Commits

Each task was committed atomically:

1. **Task 1: Reword the nsec-branch local-encryption prompt to read as creation** - `9156c70a4` (fix)
2. **Task 2: Make the ncryptsec prompt on the same screen read explicitly as re-entry** - `a8cce223b` (fix)

## Files Created/Modified
- `src/views/signin/nsec.tsx` - Reworded the two signin-flow `window.prompt` string literals (nsec creation copy, ncryptsec re-entry copy); no other lines touched besides prettier's line-wrap of the longer nsec string.

## Decisions Made
None - followed plan as specified. Both target strings matched the plan's `<action>` text exactly; no rewording judgment calls were needed beyond copying the specified literals.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Verification Results

Ran the plan's full `<verification>` block after both tasks:
1. `tsc --noEmit -p tsconfig.json` — passes.
2. `git diff --stat HEAD~2 HEAD -- src/` — shows exactly `src/views/signin/nsec.tsx`, 4 insertions / 2 deletions (string literals plus prettier line-wrap only).
3. `grep -rn "window.prompt" src/ | wc -l` — returns 4 (no prompt added or removed): `accounts.ts:25`, `nsec.tsx:54`, `nsec.tsx:66`, `migrate-to-device.tsx:29`.
4. `prettier --check src/views/signin/nsec.tsx` — passes.
5. Manual smoke of both signin paths (nsec create, ncryptsec re-enter) was NOT run interactively in this session (no browser/dev-server available to the executor); the plan's `<human-check>` items for both tasks are deferred to UAT. Copy content and control-flow correctness were confirmed via source inspection and the automated checks above.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
GH-356 is closed by this change. No blockers. The two `<human-check>` manual smoke items (visually confirming the create-vs-enter distinction in a live browser dialog) remain open for UAT and should be exercised during `/gsd-verify-work` or manual QA before release.

---
*Quick task: 260829-n9x*
*Completed: 2026-08-29*
