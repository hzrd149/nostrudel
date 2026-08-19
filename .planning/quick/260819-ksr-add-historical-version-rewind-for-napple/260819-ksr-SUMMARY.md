---
phase: quick-260819-ksr
plan: 01
subsystem: napplets
tags: [react, nostr, applesauce, rxjs, chakra-ui, napplets, replaceable-events]

requires: []
provides:
  - getNappletHistoryFilter helper for building coordinate-scoped napplet history filters
  - useNappletHistory hook returning newest-first, deduplication-disabled version history
  - NappletHistoryDrawer right-side version-history UI
  - Rewind wiring in NappletFrame (selectVersion, active-version resolution, Back to latest)
affects: [napplets, napplet-store, napplet-shell]

tech-stack:
  added: []
  patterns:
    - "Non-deduplicated relay history query: pool.request(relays, [filter], { eventStore: null }) mirrors src/hooks/use-list-history.ts"
    - "active = version ?? event pattern for optional historical-version override with a single resolution effect"

key-files:
  created:
    - src/hooks/use-napplet-history.ts
    - src/components/napplets/napplet-history-drawer.tsx
  modified:
    - src/helpers/nostr/napplets.ts
    - src/components/napplets/napplet-frame.tsx

key-decisions:
  - "Mirrored src/hooks/use-list-history.ts structure exactly for useNappletHistory (scan+addSeenRelay merge, defaultIfEmpty([]), eventStore: null) to keep the two history hooks consistent."
  - "Info IconButton now always opens the drawer when canRewind is true (not gated on address), since kind 15129 root napplets have no naddr but do have replaceable history."
  - "NappletHistoryDrawer is always rendered (isOpen controlled by useDisclosure) so it doesn't lose scroll/state on toggle; it can only ever open via the canRewind-gated button."

requirements-completed: [QUICK-260819-ksr]

coverage:
  - id: D1
    description: "Info button opens a right-side 'Version history' drawer instead of navigating to the store page"
    requirement: "QUICK-260819-ksr"
    verification:
      - kind: unit
        ref: "grep -c NappletHistoryDrawer src/components/napplets/napplet-frame.tsx (== 2: import + usage)"
        status: pass
      - kind: manual_procedural
        ref: "pnpm dev -> open a running napplet -> click info button"
        status: unknown
    human_judgment: true
    rationale: "Requires a running dev server and a live napplet with relay-served history to visually confirm the drawer slide-in and badge states."
  - id: D2
    description: "Drawer lists every historical version newest-first with timestamp and per-version relay hints, queried with deduplication disabled"
    requirement: "QUICK-260819-ksr"
    verification:
      - kind: unit
        ref: "grep -c 'eventStore: null' src/hooks/use-napplet-history.ts (>=1)"
        status: pass
    human_judgment: true
    rationale: "Whether relays actually return more than one version depends on live relay data outside this repo's control."
  - id: D3
    description: "Selecting a historical version reloads the running iframe from that version's verified index.html"
    requirement: "QUICK-260819-ksr"
    verification:
      - kind: unit
        ref: "grep -c 'event: active' src/components/napplets/napplet-frame.tsx (== 1)"
        status: pass
    human_judgment: true
    rationale: "Iframe reload behavior needs a live browser to confirm srcdoc actually swaps to the older manifest's content."
  - id: D4
    description: "Visible 'viewing historical version' indicator with one-click Back to latest while rewound"
    requirement: "QUICK-260819-ksr"
    verification:
      - kind: unit
        ref: "npx tsc -p tsconfig.json (Alert block with Timestamp + Back to latest Button compiles)"
        status: pass
    human_judgment: true
    rationale: "Visual confirmation of the alert bar requires running the app."
  - id: D5
    description: "Drawer still offers a link to the full app details page (/app/store/<naddr>)"
    requirement: "QUICK-260819-ksr"
    verification:
      - kind: unit
        ref: "grep -n 'app/store/' src/components/napplets/napplet-history-drawer.tsx"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-08-19
status: complete
---

# Quick Task 260819-ksr: Historical version rewind for napplets Summary

**Added an internet-archive style rewind for napplets: the info button now opens a "Version history" drawer (queried with replaceable-event deduplication disabled) that lets a user reload the running napplet from any prior manifest version, with a visible indicator and one-click return to latest.**

## Performance

- **Duration:** 35min
- **Started:** 2026-08-19T13:35:00Z
- **Completed:** 2026-08-19T14:10:07Z
- **Tasks:** 3/3
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `getNappletHistoryFilter` builds a coordinate-scoped filter (kind+author+`#d` for addressable kind 35129, kind+author for replaceable-only kind 15129, `undefined` for the immutable snapshot kind 5129).
- `useNappletHistory` mirrors `useListHistory`'s non-deduplicated relay query (`pool.request(relays, [filter], { eventStore: null })`), merging duplicate ids and unioning `getSeenRelays` hints, sorted newest-first.
- `NappletHistoryDrawer` renders the loading/empty/list states, badges "Latest" and "Viewing", exposes an "App details" link, and calls `onSelect` + `onClose` on Load.
- `NappletFrame` now tracks an optional `version` override (`active = version ?? event`), routes `resolveNapplet`/`requestConsent`/shell-frame registration through `active`, and resets on napplet navigation. A shared `teardownFrame` helper keeps `reload` and `selectVersion` from drifting apart.
- Install and the app-details link still always target the latest `event`, matching the plan's requirement that a rewind never changes what gets installed.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add napplet history filter helper and the non-deduplicated history hook** - `2af456d3f` (feat)
2. **Task 2: Build the napplet history drawer** - `770b031f5` (feat)
3. **Task 3: Wire rewind into the running napplet frame** - `048067401` (feat)

**Plan metadata:** pending (orchestrator docs commit)

## Files Created/Modified
- `src/helpers/nostr/napplets.ts` - Added `getNappletHistoryFilter(event)` export.
- `src/hooks/use-napplet-history.ts` (new) - `useNappletHistory(event?)` hook returning `{ versions, relays }`.
- `src/components/napplets/napplet-history-drawer.tsx` (new) - `NappletHistoryDrawer` presentation component.
- `src/components/napplets/napplet-frame.tsx` - Rewind state, `active`-based resolution/registration, header button + drawer + historical-version alert bar.

## Decisions Made
- Mirrored `use-list-history.ts` exactly for the new hook's relay-query shape rather than introducing a different accumulation strategy, to keep the two history hooks maintainable as one pattern.
- Kept the drawer always mounted (Chakra `Drawer isOpen` toggling) instead of conditionally rendering it, since it can only be opened via the `canRewind`-gated info button and this avoids losing the `useNappletHistory` subscription state on every open/close.
- Left `event` (not `active`) as the source for `getNappletNaddr`/install/history-drawer `event` prop per the plan, so installing and the drawer's own "coordinate" line always reflect the canonical latest manifest, never a rewound one.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc -p tsconfig.json` exits 0 (verified after each task and at the end).
- `grep -rn "eventStore: null" src/hooks/use-napplet-history.ts` matches (code + doc comment).
- `git diff --stat package.json` is empty — no new dependency added.
- `grep -rn "app/store/" src/components/napplets/napplet-frame.tsx` no longer matches — the store link now lives only in `napplet-history-drawer.tsx`.

## Known Stubs

None. All wiring is live: the drawer fetches real relay data via `useNappletHistory`, and `selectVersion` re-resolves the iframe through the existing `resolveNapplet`/`requestConsent` pipeline.

## Threat Flags

None. All new surface (relay-returned historical manifests, the rewound iframe, and shell frame registration for a rewound version) was already anticipated and mitigated per the plan's `<threat_model>` (T-ksr-01 through T-ksr-04): `resolveNapplet` still verifies signatures/blob hashes, `requestConsent` still runs per-version, and the shell frame registry still uses the active version's identity.

## Manual Verification Still Needed

Task 3's `<human-check>` block (drawer open, badge states, Load/Back-to-latest round trip against live relay data) requires `pnpm dev` and a running napplet with relay-served history — not runnable in this non-interactive execution environment. Recommend the user perform this walkthrough before considering the feature fully verified end-to-end.

## Self-Check: PASSED
