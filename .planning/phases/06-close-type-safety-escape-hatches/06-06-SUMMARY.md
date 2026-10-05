---
phase: 06-close-type-safety-escape-hatches
plan: 06
subsystem: webxdc
tags: [typescript, type-guard, vitest, webxdc, postmessage, nostr-tools]

requires:
  - phase: 06-close-type-safety-escape-hatches
    provides: wave 1 type-safety cleanups (06-01..06-03)
provides:
  - isWebxdcMessage type guard and WebxdcMessage type for iframe postMessage envelopes
  - vitest coverage pinning guard equivalence with the old truthiness check
  - useWebxdc collected events typed as NostrEvent[]
affects: [phase-06 verification, webxdc]

tech-stack:
  added: []
  patterns:
    - "Untrusted postMessage data read as unknown and narrowed by a pure, dependency-free guard"

key-files:
  created:
    - src/components/webxdc/jsonrpc.ts
    - src/components/webxdc/jsonrpc.test.ts
  modified:
    - src/components/webxdc/webxdc.tsx
    - src/hooks/use-webxdc.ts

key-decisions:
  - "Guard mirrors the old check exactly: non-null object, 'jsonrpc' in data, strictly equals '2.0' (no Array.isArray, no id/method type checks) per D-15"
  - "handleRequest id/method and sub-handler method take unknown so non-string methods still get the -32601 Method-not-found reply"

patterns-established:
  - "Pure guard module with no imports so it loads in vitest's node environment"

requirements-completed: [D-11, D-13, D-14, D-15, D-16]

coverage:
  - id: D1
    description: "isWebxdcMessage guard accepts every envelope the old check accepted and rejects the same values"
    requirement: "D-14"
    verification:
      - kind: unit
        ref: "src/components/webxdc/jsonrpc.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "webxdc.tsx onMessage reads event.data as unknown behind the origin/source checks and narrows with the guard"
    requirement: "D-11"
    verification:
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D3
    description: "useWebxdc events typed NostrEvent[] with no any casts"
    requirement: "D-11"
    verification:
      - kind: other
        ref: "pnpm build; aislop hook reports 0 findings for src/hooks/use-webxdc.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "A webxdc app loads, receives webxdc.init, and sends/receives a state update in the real app"
    verification: []
    human_judgment: true
    rationale: "Requires a live webxdc app in a browser iframe; OUTSTANDING for /gsd-verify-work"

duration: 10min
completed: 2026-10-05
status: complete
---

# Phase 6 Plan 06: webxdc message guard and NostrEvent typing Summary

Replaced the webxdc iframe `any` cast with an `unknown` read narrowed by a tested `isWebxdcMessage` guard, and typed `useWebxdc`'s collected events as `NostrEvent[]`, clearing 4 bucket-E findings.

## Accomplishments

- New dependency-free `src/components/webxdc/jsonrpc.ts` exporting `WebxdcMessage` and `isWebxdcMessage`.
- `jsonrpc.test.ts` pins accepted cases (including non-string id/method, arrays carrying `jsonrpc`, prototype-inherited `jsonrpc`) and rejected cases (null/undefined/primitives/`[]`/`{}`/wrong version).
- `webxdc.tsx`: origin and source checks stay first; guard follows; `handleRequest`, `handleUpdateRequest` and `handleRealtimeRequest` take `id`/`method` as `unknown`, so odd requests still receive the -32601 reply. The `RequestParams` alias and its eslint-disable are untouched (D-04).
- `use-webxdc.ts`: `useState<NostrEvent[]>`, dedupe via `e.id === event.id`, own-echo check via `event.pubkey === activePubkey`; hook reports 0 findings for the file.

## Task Commits

1. Task 1 RED: `f36342bfc` test(06-06): add failing test for isWebxdcMessage guard
2. Task 1 GREEN: `6b3a02fa2` feat(06-06): add isWebxdcMessage type guard
3. Task 2: `bc0fd92d7` refactor(06-06): narrow webxdc iframe message with guard
4. Task 3: `3ebaa1de2` refactor(06-06): type useWebxdc collected events as NostrEvent[]

## Verification

- `pnpm test`: 3 files, 19 tests pass. `pnpm build` passes after each task. Prettier check passes on all four files.
- `webxdc.tsx`: no `as any`; one remaining `no-explicit-any` disable (`RequestParams`); remaining aislop findings are pre-existing `narrative-comment` and `hardcoded-url`.
- Manual check (OUTSTANDING for /gsd-verify-work): a webxdc app loads, receives `webxdc.init`, and sends/receives a state update.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

All four source files exist and commits f36342bfc, 6b3a02fa2, bc0fd92d7, 3ebaa1de2 are present on the branch.
