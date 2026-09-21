---
phase: quick-260920-q7c
plan: 01
subsystem: napplets
tags: [kehto, shell-provider, resource-fetch, blossom, aislop]

requires: []
provides:
  - "resource:fetch capability approved in the napplet consent modal now unlocks fetches from any http(s) origin, not just the account's Blossom servers"
  - "per-origin 'Allow network access?' prompt, its localStorage always-allow list, session grant tracking, and grant queue are removed"
affects: [napplet-frame, napplet-shell-provider]

actuals:
  tokens: 2900
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Shell-side approvedCapabilities record keyed by identityKey(), because the kehto runtime ACL defaults to permissive and cannot report which capabilities the user actually approved"

key-files:
  created:
    - .changeset/quiet-napplets-fetch.md
  modified:
    - src/providers/global/napplet-shell-provider.tsx

key-decisions:
  - "Kept the kind-10063 Blossom origin allowance as an unconditional fallback alongside the approved-capability check, so a napplet with no approved resource:fetch keeps today's access to the user's own servers"
  - "Rejected non-http(s) schemes before the allowance check runs, per the T-q7c-04 mitigation, using the same 'denied'/blocked-by-policy error path as an unapproved origin"
  - "No migration code for the old resource always-allow localStorage key: napplets are unreleased and nothing reads that key any more"

patterns-established:
  - "approvedCapabilities Map<identityKey, Set<Capability>>: written by grantCapabilities (replace, not merge) and cleared on same-session denial in respond(false)"

requirements-completed: [QUICK-260920-NAPPLET-RESOURCE]

coverage:
  - id: D1
    description: "A napplet with approved resource:fetch can fetch any http(s) URL through resource.bytes/resource.bytesMany from any origin with no further prompt"
    requirement: QUICK-260920-NAPPLET-RESOURCE
    verification:
      - kind: unit
        ref: "tsc --project tsconfig.json (type-level check that isAllowed/hasApprovedCapability wiring compiles)"
        status: pass
    human_judgment: true
    rationale: "No automated test exercises the postMessage fetch flow end-to-end; the plan's own verification section marks the live-napplet check as an optional manual step, and pnpm dev is noted in STATE.md as unreliable on this machine, so this was not exercised live this session."
  - id: D2
    description: "No per-server network prompt exists anywhere; the shell renders exactly two modals (capability consent, intent choice)"
    requirement: QUICK-260920-NAPPLET-RESOURCE
    verification:
      - kind: other
        ref: "grep -c '<Modal isOpen' src/providers/global/napplet-shell-provider.tsx == 2"
        status: pass
    human_judgment: false
  - id: D3
    description: "A napplet without approved resource:fetch still fetches from the account's own Blossom servers and is denied blocked-by-policy for every other origin"
    requirement: QUICK-260920-NAPPLET-RESOURCE
    verification:
      - kind: unit
        ref: "tsc --project tsconfig.json (isAllowed retains the getBlossomOrigins() branch unconditionally)"
        status: pass
    human_judgment: true
    rationale: "Same as D1 — the actual runtime fetch/deny behavior for a live napplet was not exercised in-browser this session."
  - id: D4
    description: "Non-http(s) schemes are denied with blocked-by-policy"
    requirement: QUICK-260920-NAPPLET-RESOURCE
    verification:
      - kind: other
        ref: "grep -c '\"https:\"' src/providers/global/napplet-shell-provider.tsx >= 1 (scheme check precedes isAllowed in fetchOne)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Per-origin always-allow localStorage list, session grant tracking, grant queue, and 'Allow network access?' modal are gone from the code"
    verification:
      - kind: other
        ref: "grep -vE '^\\s*(//|\\*)' | grep -cE 'RESOURCE_ALWAYS_ALLOW|ResourceConsentRequest|ResourceIdentity|requestResourceGrant|resourceGrantKey|AlwaysAllowedResourceOrigin|respondResource|resourceConsent|sessionResourceGrants|resourceGrantQueue|Allow network access' == 0"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-09-20
status: complete
---

# Phase quick-260920-q7c Plan 01: Replace per-Blossom-server napplet permission Summary

**Napplet resource fetches now gate on the `resource:fetch` capability approved in the existing consent modal, replacing the deleted per-origin "Allow network access?" prompt and its localStorage grant plumbing.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-09-20T18:59Z (approx, from plan commit)
- **Completed:** 2026-09-20T19:14Z
- **Tasks:** 2
- **Files modified:** 2 (1 modified, 1 created)

## Accomplishments
- `src/providers/global/napplet-shell-provider.tsx`: added a module-level `approvedCapabilities` record populated by `grantCapabilities` (and cleared on same-session denial), and rewired `createResourceService`'s allowance check (`isAllowed`) to permit a fetch when the identity has approved `resource:fetch` OR the origin is one of the account's Blossom servers.
- Non-http(s) schemes are now rejected in `fetchOne` before the allowance check, denied with `blocked-by-policy`.
- Deleted the per-origin always-allow localStorage helpers (`ResourceIdentity`, `ResourceConsentRequest`, `resourceGrantKey`, `getAlwaysAllowedResourceOrigins`/`addAlwaysAllowedResourceOrigin`/`isAlwaysAllowedResourceOrigin`), the `resourceConsent` state, `sessionResourceGrantsRef`, `resourceGrantQueueRef`, the `requestResourceGrant` callback, `respondResource` callback, and the "Allow network access?" modal.
- Added `.changeset/quiet-napplets-fetch.md` (patch bump) describing the change.

## Task Commits

Each task was committed atomically:

1. **Task 1: Allow napplet fetches on approved resource:fetch or a user Blossom origin, and delete the per-origin prompt path** - `92717e6b1` (feat)
2. **Task 2: Add the patch changeset and run the touched-file lint and build gates** - `daabddaf0` (docs)

_No plan-metadata commit was made by this executor — per the orchestrator's instruction, docs artifacts (this SUMMARY, STATE.md) are committed by the orchestrator, not this executor._

## Files Created/Modified
- `src/providers/global/napplet-shell-provider.tsx` - Rewrote the resource-fetch allowance check to gate on the consent-approved `resource:fetch` capability (or the account's Blossom origins); deleted the per-origin prompt/storage/session-grant plumbing and its modal.
- `.changeset/quiet-napplets-fetch.md` - Patch changeset describing the permission-model change.

## Decisions Made
- Kept the kind-10063 Blossom origin allowance as an unconditional fallback in `isAllowed`, so a napplet with no approved `resource:fetch` retains today's access to the account's own servers, per the plan's explicit requirement.
- Used the `"denied"` error code (which maps to napplet-facing `blocked-by-policy`) for both the scheme rejection and the missing-capability rejection, matching the plan's interface facts about `sendResourceError`.
- Did not add a Blossom-URL or sha256 shape check to the approved-capability path — an approved `resource:fetch` covers any http(s) URL, per the plan's explicit constraint.
- Did not add migration code to clear the old `nostrudel:napplet:resource:always-allow` localStorage key, since napplets are unreleased and nothing reads it any more.

## Deviations from Plan

None - plan executed exactly as written. All identifiers named in the plan's deletion list are gone from the file (confirmed via the comment-stripped grep), and all new identifiers (`approvedCapabilities`, `hasApprovedCapability`, `isAllowed`) are present.

## Issues Encountered

The Task 1 and Task 2 `<verify>` blocks are written with `cd /home/user/Projects/noStrudel` — since this execution ran in an isolated git worktree at `.claude/worktrees/agent-a626ec2eca7475133`, all verification commands were run from the worktree root instead (per the worktree isolation rules), against the worktree's own checkout. Results were otherwise identical to what the plan's verify blocks specify.

## User Setup Required

None - no external service configuration required.

## Verification Results

- `pnpm exec tsc --project tsconfig.json` — passed, no output.
- Task 1's identifier/structure checks (banned-identifier grep, `approvedCapabilities`/`getBlossomOrigins`/`createResourceService(resource)`/`"resource:fetch"`/`"https:"` presence counts, exactly 2 `<Modal isOpen`, `Grant napplet access?`, `createBlossomUploadService(getUpload)`, `blossomOriginsRef`) — all passed.
- `pnpm exec aislop scan --json --include src/providers/global/napplet-shell-provider.tsx .` — 0 error-severity findings, 19 warnings (down from the planning baseline of 20, as the plan predicted the deletions would shorten the file).
- `pnpm build` — exited 0 (tsc + vite client build + service worker build all succeeded).
- The plan's optional manual/live-napplet checks (approving a real napplet's consent prompt and observing no second prompt on a non-Blossom server; confirming an unapproved napplet is denied `blocked-by-policy` outside its Blossom servers) were **not** exercised — `pnpm dev` is noted as unreliable on this machine per STATE.md, and the plan itself marks this check "not blocking". Recorded above as `human_judgment: true` on deliverables D1 and D3.

## Next Phase Readiness

The napplet resource permission model is now single-gated on the consent modal's `resource:fetch` approval plus the existing Blossom-origin allowance. No blockers. The optional live-napplet manual verification (a napplet with `requires resource` fetching from a non-Blossom server after approval) remains available as a follow-up smoke test whenever `pnpm dev` is usable on this machine.

---
*Phase: quick-260920-q7c*
*Completed: 2026-09-20*
