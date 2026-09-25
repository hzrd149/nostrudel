---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 10
subsystem: napplet-shell
tags: [refactor, napplet, permissions, access-control, react, service-module]

requires:
  - phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
    provides: verified rescan/verification loop from waves 1-2 (D-17)
provides:
  - "src/services/napplet-shell/permissions.ts — encapsulated napplet identity, window identity registry, approved-capability record, always-allow trio, grant, and revoke"
  - "src/services/napplet-shell/relay-tiers.ts — read/write relay-tier helpers"
  - "a thinned napplet-shell-provider.tsx (1163 -> 1117 lines) that imports permission/relay-tier logic instead of declaring it"
affects: [05-11-plan, 05-12-plan, 05-13-plan]

tech-stack:
  added: []
  patterns:
    - "Cross-region mutable state gets a single owning service module with function-only exports; the map/set itself is never exported (D-08 Pattern 2)"
    - "A move that cannot be pure lands as its own follow-up commit that says so (D-16)"

key-files:
  created:
    - src/services/napplet-shell/permissions.ts
    - src/services/napplet-shell/relay-tiers.ts
  modified:
    - src/providers/global/napplet-shell-provider.tsx

key-decisions:
  - "windowIdentities lives in permissions.ts alongside approvedCapabilities (not a separate window-identities.ts), per D-08's discretion clause — both are small and conceptually adjacent (\"who is this napplet, what have we granted it\")"
  - "Resolved a tension between the plan's Task 1 prose (\"leave the consent response callback still calling the map's delete method directly\") and its own harder Task 1 acceptance criterion (\"neither map is exported, ever\") by treating the non-export requirement as authoritative: Task 1 introduced a minimal, necessary accessor so the move could complete without ever exporting the map; Task 2 promoted it into the named, documented revokeCapabilities API beside grantCapabilities, with no functional change between the two commits"
  - "grantCapabilities/revokeCapabilities/hasApprovedCapability/isAlwaysAllowed/addAlwaysAllowed are all exported as pure, importable functions (not closures over React state), satisfying D-15's testability requirement ahead of plan 05-13"

requirements-completed: []

coverage:
  - id: D1
    description: "Napplet permission state (identity type, window identity registry, approved-capability map, always-allow trio, grant, revoke) moved into src/services/napplet-shell/permissions.ts with both maps fully encapsulated (never exported)"
    verification:
      - kind: other
        ref: "pnpm build (typecheck+bundle) exits 0; grep -v '^\\s*//' permissions.ts | grep 'export.*new Map' returns 0 matches"
        status: pass
    human_judgment: false
  - id: D2
    description: "Relay-tier helpers (getReadRelays/getWriteRelays) moved into src/services/napplet-shell/relay-tiers.ts"
    verification:
      - kind: other
        ref: "pnpm build exits 0; grep -n 'function getReadRelays\\|function getWriteRelays' napplet-shell-provider.tsx returns 0 matches"
        status: pass
    human_judgment: false
  - id: D3
    description: "Capability revocation goes through a named revokeCapabilities function; the provider no longer calls .delete() on the approved-capability map directly"
    verification:
      - kind: other
        ref: "grep -v '^\\s*//' napplet-shell-provider.tsx | grep '\\.delete(' — only unrelated maps (inFlight, perWindow, subscriptions) remain, none touching the approved-capability map"
        status: pass
    human_judgment: false
  - id: D4
    description: "The consent-prompt, deny/allow-once/always-allow lifecycle, and relay-tier selection behave identically to before the move, in a running app"
    verification: []
    human_judgment: true
    rationale: "No test runner exists until plan 05-13 and both build_command/test_command are pnpm build (typecheck+bundle only); this security-relevant behaviour was not exercised in a live browser session in this turn"

duration: ~25min
completed: 2026-09-25
status: complete
---

# Phase 5 Plan 10: Napplet Permission State & Relay-Tier Promotion Summary

**Napplet identity/permission state and relay-tier helpers moved out of the 1163-line napplet-shell provider into two new encapsulated service modules, with both mutable maps unexported and every mutation routed through named functions.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-09-25
- **Tasks:** 2/2 completed
- **Files modified:** 3 (1 modified, 2 created)

## Accomplishments
- Created `src/services/napplet-shell/permissions.ts` owning the napplet identity type, the window identity registry (register/get/unregister accessors only — the map itself is module-private), the approved-capability record with its explanatory comment, the identity key builder (private), the approved-capability check, the always-allow trio, the capability grant, and a properly named/documented capability revocation function. Neither of the module's two mutable maps is exported; every export is a function or a type.
- Created `src/services/napplet-shell/relay-tiers.ts` owning `getReadRelays`/`getWriteRelays`, moved verbatim.
- Thinned `napplet-shell-provider.tsx` from 1163 to 1117 lines by importing the above instead of declaring them locally, and closed the one place the provider previously reached past the permission API into the raw approved-capability map.
- Both mutable maps stay unexported end-to-end (verified by grep after each commit); the provider has no way to mutate a grant except through `grantCapabilities`/`revokeCapabilities`.
- Live rescan confirms the always-allow storage key string is unchanged and appears exactly once repo-wide, and that the three sibling napplet services (`installed-napplets.ts`, `napplet-intent-delivery.ts`, `recent-napplets.ts`) are untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Relocate the permission state and relay-tier helpers verbatim (D-08, D-16)** - `09cf26c8f` (refactor)
2. **Task 2: Close the direct map access with a capability revocation (D-08, D-16)** - `8ab26c278` (refactor)

**Plan metadata:** `2db5914ba` (docs: record measured after-counts in 05-BASELINE.md)

## Files Created/Modified
- `src/services/napplet-shell/permissions.ts` - napplet identity type, window identity registry, approved-capability record, always-allow trio, grant, revoke — all pure, importable functions; both maps module-private
- `src/services/napplet-shell/relay-tiers.ts` - `getReadRelays`/`getWriteRelays`, moved verbatim
- `src/providers/global/napplet-shell-provider.tsx` - imports permission/relay-tier logic instead of declaring it; deny branch now calls `revokeCapabilities` instead of touching the map directly

## Decisions Made
- Kept the window identity registry inside `permissions.ts` rather than a sibling `window-identities.ts`, per D-08's discretion clause — it is small and conceptually adjacent to the capability record.
- Resolved the Task 1 prose/acceptance-criteria tension described in "Deviations from Plan" below by prioritizing the non-negotiable "neither map is exported" requirement, matching T-05-34's threat mitigation, over the more casual "still calling the map's delete method directly" wording.
- Named the always-allow reader (`getAlwaysAllowed`) and the identity key builder (`identityKey`) module-private (not exported) since no consumer outside `permissions.ts` needs them — only the capability-mutating and capability-checking functions are exported.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - blocking issue] Task 1's literal instruction to keep the deny branch "calling the map's delete method directly" is incompatible with the plan's own harder requirement that neither map is ever exported**
- **Found during:** Task 1 (Relocate the permission state and relay-tier helpers verbatim)
- **Issue:** The plan's Task 1 action text says to leave `respond()`'s deny branch calling `approvedCapabilities.delete(identityKey(...))` directly "for now," implying the provider still touches the raw map after Task 1. But Task 1's own acceptance criteria require "Neither map is exported... there is no line that both starts an export and declares a `new Map`. Every export in the module is a function or a type" — and this is checked as a Task 1 (not just final-state) requirement. A raw `Map.prototype.delete` call from the provider file requires the map to be reachable from outside the module, which literally exporting it (even via an intermediate binding or getter that leaks the reference) would violate the module's fundamental encapsulation goal (D-15, T-05-34).
- **Fix:** Treated the non-export requirement as authoritative (it is the harder, mechanically-checkable, and security-critical constraint). Task 1's commit introduced a minimal, necessary, non-map-exposing accessor so the move could complete and the deny branch could still clear the entry without ever exporting the map. Task 2's commit — touching only `permissions.ts` and the provider's deny branch — promoted this into the properly named, positioned-beside-`grantCapabilities`, and documented `revokeCapabilities` function, with the deny branch updated to call it. No functional difference exists between the two commits' map operations; both perform exactly `approvedCapabilities.delete(identityKey(identity))` and nothing else.
- **Files modified:** `src/services/napplet-shell/permissions.ts`, `src/providers/global/napplet-shell-provider.tsx`
- **Verification:** `pnpm build` exits 0 after each commit; `grep -v '^\s*//' permissions.ts | grep 'export.*new Map'` returns 0 matches after both commits; `grep -v '^\s*//' napplet-shell-provider.tsx | grep '\.delete('` shows only unrelated maps (`inFlight`, `perWindow`, `subscriptions`) after Task 2, none touching the approved-capability map.
- **Committed in:** `09cf26c8f` (Task 1 necessity), `8ab26c278` (Task 2 promotion)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking issue, resolved in favor of the stronger security requirement).
**Impact on plan:** No scope creep and no behavioural change beyond what both tasks already specified — the plan's two-commit split (pure move, then named revocation) is preserved exactly as designed; only the literal wording of what remains "directly" callable in the interim commit was adjusted to honor the plan's own non-negotiable map-encapsulation requirement.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`src/providers/global/napplet-shell-provider.tsx` still contains its remaining two `complexity/function-too-long` findings (`createResourceService` at line 572, `NappletShellProvider` at line 916 in the post-05-10 file) and its `complexity/file-too-large` finding (1117 lines) — all three expected to persist until plans 05-11 (resource/intent/common-actions/upload/adapter regions) and 05-12 (the two inline modals) complete, per the plan's own verification section and orchestrator scope notes. `permissions.ts` and `relay-tiers.ts` are left untouched by any further region extraction so 05-11 can freely import from them (the window identity map's register/get/unregister accessors are specifically shaped for the resource service that 05-11 extracts to consume without a cycle).

**OUTSTANDING manual-verification items (no test runner exists until 05-13; `pnpm build` only typechecks/bundles):**
- The consent-request modal actually appearing when a napplet requests capabilities it hasn't been granted.
- A denied capability actually being refused on the next request (post-`revokeCapabilities`).
- "Allow once" not surviving a frame reload (i.e., the grant is per-session, not persisted).
- "Always allow" persisting across a reload and correctly skipping the consent prompt on subsequent loads.
- `getReadRelays`/`getWriteRelays` actually selecting the expected relay sets when exercised against a running napplet frame.

None of the above were exercised in a live browser session in this turn; they are recorded here as explicit outstanding items, not assumed verified from the passing build.

---
*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-block*
*Completed: 2026-09-25*

## Self-Check: PASSED

- FOUND: src/services/napplet-shell/permissions.ts
- FOUND: src/services/napplet-shell/relay-tiers.ts
- FOUND: src/providers/global/napplet-shell-provider.tsx
- FOUND commit: 09cf26c8f
- FOUND commit: 8ab26c278
- FOUND commit: 2db5914ba
