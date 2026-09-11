---
phase: 02-adopt-a-lint-config-and-ci-quality-gate
plan: 02
subsystem: infra
tags: [github-actions, ci, aislop, lint, agents-md]

# Dependency graph
requires:
  - phase: 02-adopt-a-lint-config-and-ci-quality-gate (plan 02-01, wave 1 sibling)
    provides: "package.json scripts.lint / scripts.lint:ci and the aislop devDependency (not yet landed at execution time; lint.yml references pnpm lint:ci without requiring it to exist)"
provides:
  - "New .github/workflows/lint.yml: dedicated changed-files lint gate on pull_request and non-master pushes"
  - "AGENTS.md ### Linting subsection documenting pnpm lint vs pnpm lint:ci, gate semantics, remote caveat, exclusions, hook, and inline-ignore convention"
  - "CONVENTIONS.md Linting bullets updated to describe the adopted aislop tool instead of claiming no lint config exists"
affects: [02-01, 02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dedicated single-purpose GitHub Actions workflow per concern (lint.yml separate from deploy/release workflows), matching existing docker-image.yml per-ref concurrency pattern"
    - "Full-history checkout (fetch-depth: 0) required whenever a workflow needs to diff against a remote-tracking branch ref"

key-files:
  created:
    - .github/workflows/lint.yml
  modified:
    - AGENTS.md
    - .planning/codebase/CONVENTIONS.md

key-decisions:
  - "lint.yml triggers on pull_request (unfiltered) plus push with branches-ignore: [master] per D-13, since contributions may arrive via the ngit/nostr remote rather than a GitHub PR"
  - "Workflow-level permissions: contents: read plus checkout persist-credentials: false, since the job runs third-party scanner code and needs no write scope or repo credentials (T-02-03 mitigation)"
  - "No continue-on-error, no soft-fail, run line is exactly `run: pnpm lint:ci` with nothing appended, so the gate is blocking from day one per D-03 (T-02-04 mitigation)"
  - "AGENTS.md Linting subsection is purely additive (0 deletions) at the end of ## Code Style Guidelines, documenting the D-12 inline-ignore convention (rule name + `-- reason` required, enforced by review not tooling)"

patterns-established:
  - "Comment placed above a fetch-depth: 0 line must not repeat the literal string 'fetch-depth: 0' or duplicate-count greps against the file break (rephrase as prose instead)"

requirements-completed: [D-01, D-03, D-12, D-13, D-15]

coverage:
  - id: D1
    description: "New .github/workflows/lint.yml: dedicated workflow gating pull requests and every non-master branch push, full-history checkout, read-only token, blocking pnpm lint:ci step"
    requirement: "D-13"
    verification:
      - kind: other
        ref: "prettier --check + 13 acceptance grep checks against .github/workflows/lint.yml (name, triggers, fetch-depth, persist-credentials, permissions, setup steps, run lines, absence of continue-on-error/pull_request_target/npx/secrets.)"
        status: pass
    human_judgment: true
    rationale: "The plan's own Task 1 verification requires a real GitHub Actions run on the GitHub remote (push to a non-master branch, compare job conclusion against a local `aislop ci --changes --base gh/master` exit code). Per orchestrator instructions this plan must not push to any remote or trigger Actions runs — that check is deferred to the maintainer's end-of-phase human-check and is NOT performed here."
  - id: D2
    description: "AGENTS.md ### Linting subsection and CONVENTIONS.md Linting bullets documenting the adopted lint standard, gate scripts, and D-12 inline-ignore convention"
    requirement: "D-01, D-03, D-12, D-15"
    verification:
      - kind: other
        ref: "grep-based acceptance checks in 02-02-PLAN.md Task 2 (section ordering, required substrings, 0 deletions in AGENTS.md diff, absence of 'lint:fix' and the stale 'configuration is not detected' phrase)"
        status: pass
    human_judgment: false

# Metrics
duration: ~20min
completed: 2026-09-11
status: complete
---

# Phase 02 Plan 02: CI quality gate workflow and lint documentation Summary

**New `.github/workflows/lint.yml` changed-files gate plus an AGENTS.md `### Linting` subsection documenting the aislop tool, gate semantics, and inline-ignore convention.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Added a dedicated `.github/workflows/lint.yml` workflow (job `quality-gate`) that runs on every `pull_request` and on pushes to every branch except `master`, checks out full history so `--base origin/master` resolves, and fails the job on any non-zero `pnpm lint:ci` exit — no soft-fail, no `continue-on-error`.
- Scoped the workflow token to `contents: read` and disabled credential persistence on checkout, since the job executes third-party scanner code.
- Documented the adopted lint standard in a new `### Linting` subsection of `AGENTS.md`: the `pnpm lint` / `pnpm lint:ci` split, the inherited-error gate behavior, the `origin` (ngit/nostr) vs `gh` (GitHub) remote caveat, vendored-code exclusions, the Claude Code hook, and the D-12 inline-ignore convention with a real example from `src/sw/client/error-logger.ts`.
- Refreshed `.planning/codebase/CONVENTIONS.md`'s `**Linting:**` block so it no longer claims "no lint config is detected."

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the changed-files lint gate workflow** - `c4f191bbc` (feat)
2. **Task 2: Document the lint standard in AGENTS.md and refresh CONVENTIONS.md** - `40806db10` (docs)

**Plan metadata:** committed separately per `<final_commit>` protocol.

## Files Created/Modified

- `.github/workflows/lint.yml` - New dedicated workflow: `name: Lint`, triggers on `pull_request` and `push` (branches-ignore: master), `permissions: contents: read`, `concurrency: lint-${{ github.ref }}`, job `quality-gate` with Checkout Repo (fetch-depth 0, persist-credentials false) / pnpm/action-setup@v4 / Setup Node.js 24 / Install Dependencies / Lint (changed files only) running `pnpm lint:ci`.
- `AGENTS.md` - Added `### Linting` and `#### Inline ignores` subsections at the end of `## Code Style Guidelines`, before `## Common Patterns`. Purely additive (0 deletions).
- `.planning/codebase/CONVENTIONS.md` - Rewrote the first `**Linting:**` bullet and the `pnpm build` bullet's closing clause to describe aislop as the adopted tool instead of stating no lint config exists.

## Decisions Made

- Followed the plan's exact target state for `lint.yml` (trigger set, step names, concurrency group) — no deviations from D-13's specification.
- Rephrased the fetch-depth explanatory comment to avoid literally repeating the string `fetch-depth: 0`, which would have double-counted against the plan's own `grep -c 'fetch-depth: 0'` acceptance check (the comment said "so the diff base can resolve" instead of restating the config key).

## Deviations from Plan

None - plan executed exactly as written, aside from the comment-wording adjustment above (not a deviation rule trigger — it's a self-correction to satisfy the plan's own acceptance grep, discovered during automated verification before committing).

## Issues Encountered

- Running `pnpm exec prettier -w` on `.github/workflows/lint.yml` triggered a `pnpm install` because `node_modules` was out of sync with `pnpm-lock.yaml` (unrelated dependency version drift already present in the working tree). Confirmed via `git status --short` that `pnpm-lock.yaml`, `package.json`, and `pnpm-workspace.yaml` were untouched — only local `node_modules` state changed, which is not tracked by git. No lockfile or manifest files were modified, respecting the orchestrator's constraint that plan 02-01's paused package.json/lockfile changes must not be touched by this plan.

## User Setup Required

None - no external service configuration required.

## Pending End-of-Phase Verification

Per the plan's Task 1 `<human-check>` and this session's orchestrator notes, the following is **not yet performed** and remains a manual, end-of-phase maintainer action:

- Push this phase's commits to the GitHub remote (locally named `gh`) on a non-master branch, open the Actions tab, and confirm the "Lint" workflow runs the "Lint (changed files only)" step via `pnpm lint:ci` with no base-ref resolution error.
- Compute the expected result locally beforehand: `git fetch gh master && pnpm exec aislop ci --changes --base gh/master`, and confirm the job conclusion matches that exit code (failure on exit 1, success on exit 0).
- Confirm opening a pull request produces a second "Lint" run for the `pull_request` event.

This check depends on plan 02-01's `pnpm lint:ci` script landing first (currently paused at a maintainer checkpoint) and on a real push/PR against the shared GitHub remote, neither of which this execution performs.

## Next Phase Readiness

- `.github/workflows/lint.yml` is in place and will start functioning the moment plan 02-01's `lint` / `lint:ci` scripts and the `aislop` devDependency land — no further wiring needed in this workflow file.
- `AGENTS.md` and `CONVENTIONS.md` now give contributors and agents a place to learn the gate's behavior before plan 02-03 (rule/config authoring) and plan 02-05 (baseline calibration) proceed.
- Blocker: the Task 1 human-check (real GitHub Actions run) is still outstanding and should be exercised once plan 02-01 lands and this phase's commits reach the GitHub remote.

---
*Phase: 02-adopt-a-lint-config-and-ci-quality-gate*
*Completed: 2026-09-11*
