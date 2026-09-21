---
phase: quick-260920-qwp
plan: 01
subsystem: infra
tags: [napplet, kehto, dependencies, pnpm, tsc]

requires:
  - phase: quick-260920-q7c
    provides: "hasApprovedCapability(identity, \"resource:fetch\") gate on napplet Blossom downloads"
provides:
  - "Whole @kehto/@napplet dependency set moved to the 0.32 napplet protocol generation"
affects: [napplet-shell-provider, napplet-frame, napplets-helpers]

actuals:
  tokens: 2334
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - package.json
    - pnpm-lock.yaml
    - src/providers/global/napplet-shell-provider.tsx

key-decisions:
  - "No changeset added — the notify-service adaptation preserves identical toast behavior, so there is no user-visible change, matching the no-changeset precedent of the three prior bumps of this exact set (38f0eb9f6, a9ad3f626, 1ef74bdae)."

patterns-established: []

requirements-completed: [QUICK-260920-NAPPLET-KEHTO-BUMP]

coverage:
  - id: D1
    description: "@kehto/runtime, @kehto/services, @kehto/shell, @napplet/core, @napplet/nap bumped to 0.24.0/0.21.2/0.21.2/0.32.0/0.32.0 in package.json and pnpm-lock.yaml; @kehto/nip stays at 0.5.2; transitive @kehto/acl -> 0.19.0 and @kehto/firewall -> 0.6.0"
    requirement: QUICK-260920-NAPPLET-KEHTO-BUMP
    verification:
      - kind: other
        ref: "node -e version-check script + grep against pnpm-lock.yaml (plan Task 1 <automated> verify)"
        status: pass
    human_judgment: false
  - id: D2
    description: "pnpm build (tsc + vite build) is green against the new versions, with the notify-service call site adapted to the new NotifyServiceOptions shape"
    requirement: QUICK-260920-NAPPLET-KEHTO-BUMP
    verification:
      - kind: other
        ref: "pnpm build"
        status: pass
    human_judgment: false
  - id: D3
    description: "resource:fetch capability from quick task 260920-q7c survives the acl 0.17.0 -> 0.19.0 bump, and no unattributable package name entered the lockfile"
    verification:
      - kind: other
        ref: "grep against installed capabilities.d.ts + lockfile package-name diff vs HEAD (plan Task 1/Task 2 verify)"
        status: pass
    human_judgment: false
  - id: D4
    description: "aislop lint bar met: zero error-severity findings, each touched source file at or below its plan-time warning baseline"
    verification:
      - kind: other
        ref: "pnpm exec aislop scan --json (plan Task 2 <automated> verify)"
        status: pass
    human_judgment: false

duration: ~10min
completed: 2026-09-21
status: complete
---

# Quick Task 260920-qwp: Napplet/Kehto 0.32 Generation Bump Summary

**Bumped `@kehto/runtime`/`services`/`shell` and `@napplet/core`/`nap` to the 0.32 protocol generation, with one source adaptation to `@kehto/services`' restructured `NotifyServiceOptions`.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-09-21
- **Tasks:** 2
- **Files modified:** 3 (`package.json`, `pnpm-lock.yaml`, `src/providers/global/napplet-shell-provider.tsx`)

## Accomplishments

- Six `package.json` dependency ranges reviewed, five bumped: `@kehto/runtime` `^0.21.0` -> `^0.24.0`, `@kehto/services` `^0.19.0` -> `^0.21.2`, `@kehto/shell` `^0.19.2` -> `^0.21.2`, `@napplet/core` `^0.31.1` -> `^0.32.0`, `@napplet/nap` `^0.31.2` -> `^0.32.0`. `@kehto/nip` left untouched at `^0.5.2`, already the newest published version.
- `pnpm install` resolved the two transitive packages on its own, as predicted: `@kehto/acl` 0.17.0 -> 0.19.0, `@kehto/firewall` 0.5.0 -> 0.6.0. No entry was needed in `pnpm-workspace.yaml`'s `minimumReleaseAgeExclude` — none of the target versions were fresh enough to trip it.
- `tsc` surfaced exactly one break: `@kehto/services` 0.21.2 restructured `NotifyServiceOptions`, replacing the single `onSend(windowId, message)` callback with a set of host hooks (`present`, `dismiss`, `setBadge`, `registerChannel`, `requestPermission`, `destroyWindow`, `controls`, `onError`). `napplet-shell-provider.tsx`'s `createNotifyService({ onSend: ... })` call became `createNotifyService({ present: ({ message }) => ... })`, preserving the exact same toast behavior (`toast({ title: message.title, description: message.body, status: "info" })`) since `NotifyPresentation.message` is still a `NotifySendMessage` with `title`/`body`.
- `src/components/napplets/napplet-frame.tsx` and `src/helpers/nostr/napplets.ts` needed no changes — every symbol they import from the bumped packages is unchanged in the new versions, confirmed by `pnpm build` passing without edits to either file.
- `resource:fetch` (quick task 260920-q7c's Blossom download gate) confirmed still present in `@kehto/acl@0.19.0`'s installed `capabilities.d.ts`.
- Lockfile package-name diff against the pre-bump `HEAD` is empty — no `@kehto`/`@napplet` package name was added or removed, only the eight already-tracked names moved versions. The `@kehto`/`@napplet` scope in `pnpm-lock.yaml` contains exactly 8 distinct `name@version` keys, confirmed by the plan's grep/count assertion.
- Scoped aislop scan (`package.json` + the three napplet source files): 0 error-severity findings across the set. `package.json` 12 warnings (unchanged advisory count, not gated), `napplet-shell-provider.tsx` 19 warnings (at the plan-time baseline of 19), `napplet-frame.tsx` 2 warnings (at baseline), `helpers/nostr/napplets.ts` 0 warnings (at baseline). Lint bar met.
- `pnpm build` (`tsc --project tsconfig.json && vite build`) exits 0.

## Task Commits

1. **Task 1: Bump the five ranges to the 0.32 napplet generation, resolve the lockfile, and get pnpm build green** - `ea0fbba09` (feat)
2. **Task 2: Confirm the touched files clear the lint gate and no unreviewed package entered the tree** - no commit (verification-only task; no code changes required — lint bar was already met by Task 1's commit, lockfile diff was already clean, and the changeset decision is "none")

## Files Created/Modified

- `package.json` - Five `@kehto`/`@napplet` dependency ranges bumped to the 0.32 generation; `@kehto/nip` untouched.
- `pnpm-lock.yaml` - Regenerated resolution for all eight `@kehto`/`@napplet` packages (five direct bumps + two transitive moves), no new package names.
- `src/providers/global/napplet-shell-provider.tsx` - `createNotifyService({ onSend })` adapted to `createNotifyService({ present })` to match `@kehto/services` 0.21.2's restructured `NotifyServiceOptions`; identical toast behavior preserved.

## Decisions Made

- No changeset was added. The only source adaptation (the notify-service call-site rename) produces byte-identical runtime behavior — same toast, same trigger — so there is no user-visible change to document. This matches the no-changeset precedent set by the three prior bumps of this exact dependency set (38f0eb9f6, a9ad3f626, 1ef74bdae).

## Deviations from Plan

None - plan executed exactly as written. The plan's `<interfaces>` section anticipated "something in that range, not nothing and not a rewrite" for the source adaptation, and the single `onSend` -> `present` rename in `napplet-shell-provider.tsx` was exactly that: no architectural change, no new capability wiring, no `any`/non-null-assertion/`@ts-expect-error` casts.

## Issues Encountered

None. `pnpm install` resolved cleanly on the first run (no peer-dependency error, no release-age exclusion needed). `tsc` reported exactly the one break anticipated by the plan's risk analysis.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The napplet/kehto stack is current on the 0.32 protocol generation; the app is no longer one generation behind.
- Capability surface note (not actioned, per plan's threat register T-qwp-02): `ALL_CAPABILITIES` from acl 0.19.0 gained `fs:read`/`fs:write`. `getNappletRequiredCapabilities` in `src/helpers/nostr/napplets.ts` admits any string in that list, so a manifest requesting `fs` capabilities will now appear in the consent modal even though this shell registers no fs service. Approving one grants nothing today (no fs service is wired), but the consent prompt is misleading. Flagged here as a candidate follow-up to filter the consent list to capabilities the shell actually implements — not fixed in this task, since it's an accepted-risk item in the plan's threat model, not a defect this bump introduced.
- No blockers for future napplet/kehto work.

---
*Phase: quick-260920-qwp*
*Completed: 2026-09-21*

## Self-Check: PASSED

- FOUND: package.json
- FOUND: pnpm-lock.yaml
- FOUND: src/providers/global/napplet-shell-provider.tsx
- FOUND: .planning/quick/260920-qwp-update-all-napplet-and-kehto-dependencie/260920-qwp-SUMMARY.md
- FOUND: ea0fbba09
