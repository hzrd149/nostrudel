---
phase: 02-adopt-a-lint-config-and-ci-quality-gate
plan: 01
subsystem: infra
tags: [aislop, lint, pnpm, devDependency, ci-gate]

# Dependency graph
requires:
  - phase: 02-adopt-a-lint-config-and-ci-quality-gate (plan 02)
    provides: ".github/workflows/lint.yml calls `pnpm lint:ci`, and AGENTS.md documents the D-12 inline-ignore convention"
provides:
  - "aislop 0.16.1 installed as an exact-pinned devDependency, resolved identically in pnpm-lock.yaml"
  - "`pnpm lint` (aislop scan .) and `pnpm lint:ci` (aislop ci --changes --base origin/master) scripts in package.json"
affects: ["02-03 (hand-written .aislop/config.yml)", "CI lint workflow"]

# Tech tracking
tech-stack:
  added: ["aislop@0.16.1 (devDependency)"]
  patterns: ["Exact-pin third-party lint tooling with --save-exact so local and CI runs use one binary (D-14)"]

key-files:
  created: []
  modified: ["package.json", "pnpm-lock.yaml"]

key-decisions:
  - "Maintainer explicitly approved installing aislop@0.16.1 at the blocking package-legitimacy checkpoint before any install command ran."
  - "pnpm-workspace.yaml left unmodified: aislop 0.16.1 and its transitive dependencies triggered neither the strictDepBuilds nor minimumReleaseAge pnpm 11 policy, so no allowBuilds deny entries were needed."

patterns-established:
  - "Exact-pinned lint tooling installed via `pnpm add -D <pkg>@<version> --save-exact`, never hand-edited into package.json, so pnpm and the lockfile agree byte-for-byte."

requirements-completed: [D-01, D-14, D-15]

coverage:
  - id: D1
    description: "Maintainer approves aislop package legitimacy before any install command runs"
    human_judgment: true
    rationale: "Package-legitimacy checkpoints are never auto-approvable per protocol; the maintainer's explicit 'approved' reply is the only valid evidence, already recorded in this session before Task 2 started."
  - id: D2
    description: "aislop 0.16.1 installed as an exact-pinned devDependency, locked in pnpm-lock.yaml, with matching lint/lint:ci scripts and no fix script"
    requirement: "D-14, D-15"
    verification:
      - kind: other
        ref: "node -e '...' checking devDependencies.aislop===\"0.16.1\", scripts.lint, scripts[\"lint:ci\"], no extra lint:* script, aislop absent from dependencies -- exit 0, printed 'package.json OK'"
        status: pass
      - kind: other
        ref: "pnpm exec aislop --version | grep -F 0.16.1 -- printed 0.16.1"
        status: pass
      - kind: other
        ref: "pnpm install --frozen-lockfile -- exit 0"
        status: pass
      - kind: other
        ref: "grep -c 'aislop@0.16.1' pnpm-lock.yaml -- returned 2 (>= 1 required)"
        status: pass
      - kind: other
        ref: "git diff --numstat package.json -- 3 insertions, 0 deletions"
        status: pass
      - kind: other
        ref: "git diff --quiet pnpm-workspace.yaml -- exit 0, file unmodified"
        status: pass
    human_judgment: false

# Metrics
duration: ~10min (continuation session; Task 1 evidence gathering and approval occurred in a prior session)
completed: 2026-09-11
status: complete
---

# Phase 02 Plan 01: Install aislop devDependency and lint scripts Summary

**aislop 0.16.1 installed as an exact-pinned devDependency behind a maintainer-approved package-legitimacy checkpoint, with `pnpm lint` / `pnpm lint:ci` scripts added to package.json for the D-01 changed-files CI gate.**

## Performance

- **Duration:** ~10 min (this continuation session)
- **Completed:** 2026-09-11
- **Tasks:** 2 (1 checkpoint, 1 auto)
- **Files modified:** 2 (package.json, pnpm-lock.yaml)

## Accomplishments
- Maintainer approved the aislop package-legitimacy checkpoint (Task 1) before any install command ran, based on registry/repo evidence gathered in a prior session (npm creation date, version count, download volume, matching repository/homepage, no lifecycle scripts on aislop or its binary-carrying dependencies).
- Installed `aislop@0.16.1` as an exact-pinned devDependency via `pnpm add -D aislop@0.16.1 --save-exact`, letting pnpm write both package.json and pnpm-lock.yaml.
- Added `scripts.lint` (`aislop scan .`) and `scripts["lint:ci"]` (`aislop ci --changes --base origin/master`) to package.json immediately after the existing `format` script, with no fix script added (D-15 declines it).
- Confirmed pnpm 11's `strictDepBuilds` and `minimumReleaseAge` policies did not trigger for aislop or its transitive dependencies, so `pnpm-workspace.yaml` required no changes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Maintainer confirms aislop package legitimacy before install** - no commit (checkpoint task; produces no file changes per plan). Maintainer approval ("approved") was received and is recorded in this SUMMARY as the required evidence trail.
2. **Task 2: Install aislop 0.16.1 exact-pinned and add the lint scripts** - `520155d96` (feat)

**Plan metadata:** committed separately per the final-commit step below.

## Files Created/Modified
- `package.json` - Added `devDependencies.aislop: "0.16.1"` (exact pin, no `^`/`~`) and two new scripts: `lint` (`aislop scan .`) and `lint:ci` (`aislop ci --changes --base origin/master`), placed immediately after `format`.
- `pnpm-lock.yaml` - Locked resolution of `aislop@0.16.1` and its transitive dependencies (`@biomejs/biome`, `oxlint`, `knip`, `expo-doctor`, etc.).

## Decisions Made
- Maintainer approval for the [SUS]-tagged `aislop` package was obtained explicitly before install, satisfying the blocking-human gate; the evidence (npm metadata, matching repo/homepage, absence of lifecycle scripts) is preserved above under coverage D1.
- No `allowBuilds` deny entries were added to `pnpm-workspace.yaml` since neither pnpm 11 policy (unreviewed build scripts, minimum release age) triggered during install — the plan's conditional fallback path was not needed.

## Deviations from Plan

None - plan executed exactly as written. Task 1's checkpoint was already resolved (maintainer replied "approved") per the continuation instructions; Task 2 ran precisely as specified with no deviations, no `pnpm-workspace.yaml` changes, and no prettier reformatting needed (package.json already matched Prettier style before and after the edit).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `pnpm exec aislop` is now available locally (`scan`, `ci`, `hook`, `rules` subcommands) for plan 02-03, which hand-writes `.aislop/config.yml`.
- `.github/workflows/lint.yml` (already committed in plan 02-02) calls `pnpm lint:ci`, which now resolves to a real, locked binary.
- No blockers for subsequent plans in this phase.

---
*Phase: 02-adopt-a-lint-config-and-ci-quality-gate*
*Completed: 2026-09-11*

## Self-Check: PASSED
- FOUND: .planning/phases/02-adopt-a-lint-config-and-ci-quality-gate/02-01-SUMMARY.md
- FOUND: 520155d96 (git log --oneline --all)
