---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 11
subsystem: napplet-shell
tags: [refactor, napplet, permissions, resource-fetch, upload, intent, react, service-module]

requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: "src/services/napplet-shell/permissions.ts and relay-tiers.ts (plan 05-10) — reused, not duplicated or bypassed"
provides:
  - "src/services/napplet-shell/intent-service.ts — intent payload coercion, installed-handler lookup, candidate/availability/failure builders, preference matcher, createNappletIntentService factory"
  - "src/services/napplet-shell/common-actions.ts — first-value helper, identity profile/follows readers, pubkey/event-id normalisers, profile pointer builder, common publish, common profile/follows readers, follow change, reaction, report draft/action"
  - "src/services/napplet-shell/upload-service.ts — blob-to-file helper, UploadConfig type, createBlossomUploadService factory"
  - "src/services/napplet-shell/resource-service.ts — resource limits, helpers, createResourceService divided into isResourceRequestAllowed/fetchResource/handleResourceMessage (D-12, finding cleared not relocated)"
  - "src/services/napplet-shell/adapter.ts — disabled-domain list, signer helper, createAdapter composition root"
  - "a thinned napplet-shell-provider.tsx (1117 -> 274 lines) importing all five service modules instead of declaring them"
affects: [05-12-plan, 05-13-plan]

tech-stack:
  added: []
  patterns:
    - "A factory whose plain-function budget is exceeded is divided along its own internal seams (permission check / single-operation / message dispatcher) in its own commit, separate from the verbatim move that relocated it (D-12/D-16)"
    - "A shared helper used only by one real owner (here: the signer helper, used solely inside the composition root) is left in place until its owner moves, then travels with it — rather than being duplicated or moved prematurely to satisfy a plan's stated schedule"

key-files:
  created:
    - src/services/napplet-shell/intent-service.ts
    - src/services/napplet-shell/common-actions.ts
    - src/services/napplet-shell/upload-service.ts
    - src/services/napplet-shell/resource-service.ts
    - src/services/napplet-shell/adapter.ts
  modified:
    - src/providers/global/napplet-shell-provider.tsx

key-decisions:
  - "getSigner was left in the provider through Tasks 1-2 and moved only in Task 3 with its actual sole owner, createAdapter — measured pre-move grep showed its only two call sites (auth.getSigner, identity service options) both live inside createAdapter; the intent service never referenced it, contradicting the plan's own prose claim that it did (D-03 discrepancy, not a functional gap)"
  - "No scoped logger was added to intent-service.ts, common-actions.ts, or upload-service.ts (contra Task 1's generic instruction) because none of the moved functions ever called log() in the pre-move source; an unused logger constant would be dead code violating D-16's move-only constraint, following 05-09's own precedent of not adding loggers to modules that didn't already log"
  - "createResourceService's 162-line factory was divided into three module-level functions (isResourceRequestAllowed, fetchResource, handleResourceMessage) taking shared state as explicit parameters rather than closures, in a commit separate from the verbatim move, per D-12/D-16"

requirements-completed: []

coverage:
  - id: D1
    description: "Intent, common-action, and upload regions promoted verbatim into intent-service.ts, common-actions.ts, and upload-service.ts, each as its own move-only commit"
    verification:
      - kind: other
        ref: "pnpm build exits 0 after each commit; git diff --name-only confirms installed-napplets.ts/napplet-intent-delivery.ts/recent-napplets.ts untouched; grep -rn 'from \"~/' src/services/napplet-shell returns 0 matches"
        status: pass
    human_judgment: false
  - id: D2
    description: "Resource service relocated verbatim, then divided internally (permission check / fetch / message handler) so its function-too-long finding is genuinely resolved rather than relocated"
    verification:
      - kind: other
        ref: "scoped rescan of resource-service.ts returns 0 findings across all four bucket-H rules after the division; MAX_RESOURCE_BYTES/MAX_RESOURCE_URLS/MAX_CONCURRENT_RESOURCE_FETCHES and the permission gate confirmed unchanged via grep and git diff"
        status: pass
    human_judgment: false
  - id: D3
    description: "Adapter relocated as the composition root, importing all four sibling modules plus relay-tiers/permissions; event-verification call still imports the same default export (D-14); disabled-domain list and its comment travel together unchanged"
    verification:
      - kind: other
        ref: "pnpm build exits 0; grep confirms adapter.ts imports verifyEvent's default export (not a strategy); DISABLED_NAP_DOMAINS entries confirmed unchanged via diff"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every permission check that guarded a moved region (resource:fetch capability + Blossom-origin allowlist, window identity resolution, upload/intent domain advertisement, consent grant/revoke lifecycle) still guards the same operation on the same path after the move, with no scope widened and no operation left ungated"
    verification:
      - kind: other
        ref: "grep enumeration across resource-service.ts/adapter.ts/napplet-shell-provider.tsx confirms every pre-move check's boolean expression is byte-identical post-move (see 05-BASELINE.md's 05-11 section for the full enumeration)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Dispatching an intent, publishing/following/reacting/reporting via common actions, uploading via Blossom, fetching an approved/denied resource, the resource.bytesMany bounded-concurrency path, and the event-verification late-binding surfaces actually work in a running app"
    verification: []
    human_judgment: true
    rationale: "No test runner exists until plan 05-13 and both build_command/test_command are pnpm build (typecheck+bundle only); none of these security-relevant behavioural surfaces were exercised in a live browser session or against a running napplet frame in this turn"

duration: ~35min
completed: 2026-09-25
status: complete
---

# Phase 5 Plan 11: Napplet Intent/Common-Action/Upload/Resource/Adapter Promotion Summary

**Five service modules (intent, common-actions, upload, resource, adapter) promoted out of the 1117-line napplet-shell provider into `src/services/napplet-shell/*`, with the resource service's oversized factory divided internally so its finding is genuinely cleared rather than relocated — provider now 274 lines.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-09-25
- **Tasks:** 3/3 completed (6 commits: 3 for Task 1's three regions, 2 for Task 2's move+division, 1 for Task 3)
- **Files modified:** 6 (1 modified, 5 created)

## Accomplishments
- Created `src/services/napplet-shell/intent-service.ts` (146 lines) owning the intent payload coercion, installed-handler lookup, candidate/availability/failure builders, the preference matcher, and `createNappletIntentService`.
- Created `src/services/napplet-shell/common-actions.ts` (204 lines) owning the first-value helper, identity profile/follows readers, pubkey/event-id normalisers, the profile pointer builder, common publish, common profile/follows readers, follow change, reaction, and report draft/action.
- Created `src/services/napplet-shell/upload-service.ts` (62 lines) owning the blob-to-file helper, the `UploadConfig` type, and `createBlossomUploadService`.
- Created `src/services/napplet-shell/resource-service.ts` (264 lines) owning the three resource limit constants and five helpers, with `createResourceService`'s 162-line factory divided into `isResourceRequestAllowed` (the permission gate), `fetchResource` (single-resource fetch with abort tracking), and `handleResourceMessage` (the incoming-message dispatcher, including the bounded-concurrency `resource.bytesMany` path) — a scoped rescan confirms 0 findings across all four bucket-H rules after the division, down from the 1 finding the verbatim-move commit carried.
- Created `src/services/napplet-shell/adapter.ts` (243 lines) as the composition root: the disabled-domain list with its explanatory comment, the signer helper (its single definition, single real owner), and `createAdapter`, importing all four sibling service modules plus 05-10's `permissions.ts`/`relay-tiers.ts`.
- Thinned `napplet-shell-provider.tsx` from 1117 to 274 lines. Live rescan confirms bucket-H fell 3 → 1: `complexity/file-too-large` cleared (1 → 0, provider now well under the 400/600-line thresholds), `complexity/function-too-long` fell to 1 (2 → 1, `createResourceService`'s finding cleared; `NappletShellProvider`'s 195-line finding survives, owned by plan 05-12).
- No circular imports: `adapter.ts` imports the other four new modules plus `relay-tiers.ts`/`permissions.ts`; none of those import `adapter.ts` back. `common-actions.ts` imports `relay-tiers.ts` (one-directional sibling edge, same shape as 05-09's `wallets/nwc.ts` → `webln.ts`).
- Enumerated every permission check that guarded a moved region and confirmed each still guards the same operation on the same path (full detail in `05-BASELINE.md`'s 05-11 section): the `resource:fetch` capability-or-Blossom-origin gate in `resource-service.ts`, window identity resolution through `permissions.ts`'s accessors, the upload/intent domain-advertisement gating via `disabledDomains`, and the consent grant/revoke lifecycle (unmoved by this plan, still called from the same three provider sites). No permission's scope was widened; no previously-gated operation was left ungated.

## Task Commits

Each task was committed atomically:

1. **Task 1a: Relocate the intent region (D-08, D-16)** - `05d420c69` (refactor)
2. **Task 1b: Relocate the common-action region (D-08, D-16)** - `5df7a99cc` (refactor)
3. **Task 1c: Relocate the upload region (D-08, D-16)** - `3a47d3b79` (refactor)
4. **Task 2a: Relocate the resource service verbatim (D-08, D-16)** - `34f38fcbd` (refactor)
5. **Task 2b: Divide the resource service factory (D-12)** - `912e51558` (refactor)
6. **Task 3: Relocate the adapter as the composition root (D-08, D-14, D-16)** - `26613e3af` (refactor)

**Plan metadata:** `f5f8d7e6b` (docs: record measured after-counts in 05-BASELINE.md)

## Files Created/Modified
- `src/services/napplet-shell/intent-service.ts` - intent payload coercion, installed-handler lookup, candidate/availability/failure builders, preference matcher, `createNappletIntentService`
- `src/services/napplet-shell/common-actions.ts` - first-value helper, identity profile/follows readers, normalisers, profile pointer builder, common publish/profile/follows/follow-change/reaction/report
- `src/services/napplet-shell/upload-service.ts` - blob-to-file helper, `UploadConfig` type, `createBlossomUploadService`
- `src/services/napplet-shell/resource-service.ts` - resource limits/helpers, `createResourceService` divided into `isResourceRequestAllowed`/`fetchResource`/`handleResourceMessage`
- `src/services/napplet-shell/adapter.ts` - disabled-domain list, signer helper, `createAdapter` composition root
- `src/providers/global/napplet-shell-provider.tsx` - imports all five service modules instead of declaring them; component body (modals, consent/intent-choice state, registerFrame/unregisterFrame) unchanged

## Decisions Made
- Left `getSigner` in the provider through Tasks 1-2, moving it only in Task 3 with its real sole owner (`createAdapter`) — the plan's prose claimed the intent service also used it, but a pre-move grep showed only two call sites, both inside `createAdapter`; recorded as a plan-prose/measured-code discrepancy (D-03), not a functional gap.
- Did not add a scoped logger to `intent-service.ts`, `common-actions.ts`, or `upload-service.ts` (Task 1's action text asked for one) since none of their moved functions called `log(...)` in the pre-move source — an unused logger would be dead code, violating D-16's move-only constraint. Followed 05-09's precedent of not padding modules with unused logging.
- Divided `createResourceService`'s factory into three module-level functions taking shared state (`options`, `inFlight`, `perWindow`) as explicit parameters rather than closures, so the factory itself reduces to a ~20-line wire-up — landed as its own commit, separate from the verbatim move, per D-12/D-16.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - blocking issue, resolved via measured re-verification] Plan's claim that the intent service uses the signer helper did not match the measured pre-move source**
- **Found during:** Task 1 (read_first step, before writing intent-service.ts)
- **Issue:** The plan's action text says "[the signer helper] is used by the intent service and also by the adapter's authentication surface and its identity service options," implying `createNappletIntentService` needed `getSigner` and Task 1 needed to decide its owner immediately. A pre-move `grep -n "getSigner" napplet-shell-provider.tsx` showed exactly three lines: the definition and two call sites (`auth.getSigner`, the identity service's `getSigner` option), both inside the pre-move `createAdapter` body — none inside the intent region.
- **Fix:** Left `getSigner` in the provider through Tasks 1 and 2 rather than copying or prematurely relocating it, then moved it in Task 3 together with its actual sole owner, `createAdapter`, satisfying the plan's own harder requirement ("single owner... do not copy it into two modules") over its inaccurate prose about who uses it.
- **Files modified:** none beyond the already-planned Task 3 move of `createAdapter`.
- **Verification:** `grep -n "^function getSigner" src/` returns exactly one definition (`adapter.ts`) after all six commits; `pnpm build` passed after every commit.
- **Committed in:** `26613e3af` (Task 3)

**2. [Rule 1/D-16 - deviation from generic instruction, resolved in favor of the move-only constraint] Task 1's instruction to give each new module its own scoped logger conflicts with D-16 when the moved code never logged**
- **Found during:** Task 1 (writing intent-service.ts, common-actions.ts, upload-service.ts)
- **Issue:** Task 1's `<action>` says "Give each module its own scoped logger following the in-repo shape." None of the functions being moved into these three modules ever called `log(...)` in the original provider (confirmed by grep before writing each file). Declaring a `logger.extend(...)` constant with no call site would be an addition, not a move — violating D-16's "nothing else in these commits may be a behavioural edit" — and would almost certainly trigger an unused-variable lint finding.
- **Fix:** Did not declare a logger in `intent-service.ts`, `common-actions.ts`, or `upload-service.ts`. Followed 05-09's own precedent (the wallets split added no logger to modules that didn't already log, keeping exactly one scoped logger declaration across the whole split).
- **Files modified:** none (an omission, not a code change).
- **Verification:** `pnpm build` passed after every commit; no unused-variable finding was reported by the per-edit hook.
- **Committed in:** `05d420c69`, `5df7a99cc`, `3a47d3b79` (Task 1's three commits)

---

**Total deviations:** 2 — both resolved by prioritizing measured source/harder plan requirements (D-03/D-16) over the plan's more casual or inaccurate prose, matching the precedent 05-09 and 05-10 established in this same phase.
**Impact on plan:** No scope creep and no behavioural change beyond what the plan specified — both deviations are omissions/deferrals that keep every commit a genuine move, not additions of new functionality.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`src/providers/global/napplet-shell-provider.tsx` carries exactly one remaining bucket-H finding: `complexity/function-too-long` on `NappletShellProvider` itself (195 lines), expected to clear in plan 05-12 when the consent modal and the intent-choice modal move into `src/components/napplets/`. `intent-service.ts`, `common-actions.ts`, `upload-service.ts`, `resource-service.ts`, and `adapter.ts` are left untouched by any further extraction so 05-12 can freely leave the provider's remaining imports as-is; 05-12 only needs to move the two `<Modal>` JSX blocks and their `respond`/`respondIntentChoice` callbacks, not touch any of this plan's five new modules.

**OUTSTANDING manual-verification items (no test runner exists until 05-13; `pnpm build` only typechecks/bundles):**
- Dispatching an intent to an installed napplet, including the choose-a-handler fallback when no napplet claims the archetype/action.
- Publishing, following/unfollowing, reacting, and reporting through the common actions from a running napplet frame.
- Uploading a file via the Blossom rail (`createBlossomUploadService`) end-to-end, including the metadata-stripping step.
- Fetching a resource both through an approved `resource:fetch` grant and through the Blossom-origin allowlist branch, and confirming a resource fetch is denied for an unapproved non-Blossom origin.
- The `resource.bytesMany` bounded-concurrency batch path returning per-URL results in the expected shape.
- The event-verification late-binding surfaces (`crypto.verifyEvent`, the worker-relay cache-write gate, the outbox router's `verifyEvent`) actually accepting valid and rejecting invalid signatures when exercised against real relay traffic.

None of the above were exercised in a live browser session in this turn; they are recorded here as explicit outstanding items, not assumed verified from the passing build.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-25*

## Self-Check: PASSED

- FOUND: src/services/napplet-shell/intent-service.ts
- FOUND: src/services/napplet-shell/common-actions.ts
- FOUND: src/services/napplet-shell/upload-service.ts
- FOUND: src/services/napplet-shell/resource-service.ts
- FOUND: src/services/napplet-shell/adapter.ts
- FOUND: src/providers/global/napplet-shell-provider.tsx
- FOUND commit: 05d420c69
- FOUND commit: 5df7a99cc
- FOUND commit: 3a47d3b79
- FOUND commit: 34f38fcbd
- FOUND commit: 912e51558
- FOUND commit: 26613e3af
- FOUND commit: f5f8d7e6b
