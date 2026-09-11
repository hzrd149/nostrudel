---
phase: 02-adopt-a-lint-config-and-ci-quality-gate
plan: 05
subsystem: infra
tags: [aislop, lint, ci, quality-gate, calibration]

# Dependency graph
requires:
  - phase: 02-adopt-a-lint-config-and-ci-quality-gate (plans 01-04)
    provides: aislop@0.16.1 pinned devDependency with lint/lint:ci scripts, .github/workflows/lint.yml, .aislop/config.yml (rule policy + vendored excludes), the Claude Code hook
provides:
  - Evidence-based ci.failBelow (95) calibrated from nine real sampled commits
  - .planning/research/aislop-scan-2026-09-11.md — whole-repo baseline report under the adopted config, mapped to backlog 999.2-999.10
  - .planning/research/aislop-scan-2026-09-11.json — raw aislop 0.16.1 scan output
  - Documented origin/master and gh/master expected-first-CI-result data points
affects: [backlog-999.2, backlog-999.3, backlog-999.4, backlog-999.5, backlog-999.6, backlog-999.7, backlog-999.8, backlog-999.9, backlog-999.10]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Calibrating a CI quality-gate threshold via disposable detached git worktrees + cherry-pick against real commits, never touching the main checkout's HEAD/branches"]

key-files:
  created:
    - .planning/research/aislop-scan-2026-09-11.md
    - .planning/research/aislop-scan-2026-09-11.json
  modified:
    - .aislop/config.yml

key-decisions:
  - "ci.failBelow set to 95: nine sampled real commits scored 100,100,100,100,100,100,100,100,98; the 98 is not >=15 points below the second-lowest (100) so no outlier was set aside, floor=98, largest multiple of 5 strictly below is 95 (D-02)."
  - "1a4f05493 fails lint:ci solely on an inherited ai-slop/swallowed-exception error in src/index.tsx (existing-file-context); 844122a7e fails on a mix of an inherited swallowed-exception pair in blob-details-modal.tsx plus security/vulnerable-dependency errors surfaced because that commit's diff touches package.json/pnpm-lock.yaml — neither was tuned away, both are expected ratchet friction per RESEARCH Pitfall 1."
  - "Gate-risk stop condition (a non-manifest-touching sample surfacing a project-wide security-engine error) did not trigger on any of the nine samples, so calibration proceeded without a blocker."
  - "Whole-repo baseline recorded once (D-04) at aislop 0.16.1 under the final adopted config: score 78/100, 1,196 findings, explicitly marked not directly comparable to the 2026-08-02 (0.14.0, bundled defaults) scan."
  - "Confirmed android/ and ios/ still contribute zero findings under aislop 0.16.1, matching the 2026-08-02 scan's scope."

requirements-completed: [D-01, D-02, D-04]

coverage:
  - id: D1
    description: "ci.failBelow calibrated from measured scores of nine real commits via disposable detached worktrees, with the selection rule and evidence recorded in the baseline report"
    requirement: "D-02"
    verification:
      - kind: other
        ref: "grep -cE '^\\s*failBelow: [0-9]*[05] +# calibrated' .aislop/config.yml && grep -c '^## CI gate calibration$' .planning/research/aislop-scan-2026-09-11.md"
        status: pass
    human_judgment: false
  - id: D2
    description: "Whole-repo baseline scan committed under the final adopted aislop 0.16.1 config, following the 2026-08-02 report structure, mapped to backlog 999.2-999.10, explicitly marked not comparable to the prior scan"
    requirement: "D-04"
    verification:
      - kind: other
        ref: "node baseline-check (Task 2 <verify> script) against .planning/research/aislop-scan-2026-09-11.json + .md"
        status: pass
    human_judgment: false
  - id: D3
    description: "Calibration and baseline left no stray git worktrees or branches, and pushed nothing"
    requirement: "D-01"
    verification:
      - kind: other
        ref: "git worktree list (1 entry) / git branch --list (master, next) checked before and after"
        status: pass
    human_judgment: false

# Metrics
duration: ~14min
completed: 2026-09-11
status: complete
---

# Phase 02 Plan 05: Calibrate CI gate and record whole-repo baseline Summary

**`ci.failBelow` calibrated to 95 from nine real sampled commits (aislop 0.16.1) in disposable detached worktrees, plus a committed whole-repo baseline (score 78/100, 1,196 findings) mapped to backlog 999.2-999.10.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-09-11T18:21:58Z (approx, continuing from 02-04 completion)
- **Completed:** 2026-09-11T18:35:17Z
- **Tasks:** 2/2
- **Files modified:** 3 (`.aislop/config.yml`, plus 2 new research files)

## Accomplishments

- Measured `aislop ci --changes --base` scores for nine real commits in disposable detached
  worktrees (parent-commit worktree + committed config + cherry-pick), leaving the main checkout's
  `HEAD`, branches, and remotes untouched throughout.
- Applied the D-02 selection rule to the nine scores (`100`x8, `98`x1): no outlier set aside
  (98 is only 2 points below the second-lowest, not the required 15+), floor 98, `failBelow` set
  to the largest multiple of 5 strictly below the floor — **95**.
- Set `.aislop/config.yml`'s `ci.failBelow: 95` with a trailing `# calibrated 2026-09-11 …`
  comment naming the evidence file; verified the diff touches exactly that one line.
- Recorded which samples fail purely on inherited (pre-existing, `existing-file-context`)
  error-severity findings versus new findings: `1a4f05493` fails only on an inherited
  `src/index.tsx` `ai-slop/swallowed-exception`; `844122a7e` fails on a mix of an inherited
  `blob-details-modal.tsx` swallowed-exception pair plus `security/vulnerable-dependency` findings
  that a package.json/pnpm-lock.yaml-touching diff surfaces project-wide.
- Confirmed the gate-risk stop condition (security-engine error on a non-manifest-touching sample)
  never triggered across the nine samples.
- Recorded `origin/master` and `gh/master` long-lived-branch data points (score 97, exit 1 on both)
  as the expected first CI result for this branch, kept out of the selection rule per RESEARCH
  Pitfall 8.
- Ran the one-time whole-repo baseline scan (`pnpm exec aislop scan --json .`, aislop 0.16.1,
  final adopted config): score 78/100, 1,196 findings (87 errors / 1,057 warnings / 52 info),
  284 auto-fixable, 2,164 files scanned, 0 findings under `android/`/`ios/`.
- Wrote `.planning/research/aislop-scan-2026-09-11.md` following the 2026-08-02 report's structure
  (Headline, Caveats, buckets A-I mapped 1:1 to backlog 999.2-999.10, a new bucket J for rule
  categories introduced since 0.14.0 plus the security engine's first non-zero findings, the
  CI gate calibration section, then Reproducing), with an explicit "not directly comparable" note
  against the 2026-08-02 (0.14.0, bundled defaults) scan.
- Committed the raw JSON alongside, confirmed it parses and contains no absolute local paths.

## Task Commits

1. **Task 1: Calibrate ci.failBelow against nine real commits** - `d18dc81a0` (feat)
2. **Task 2: Record the whole-repo baseline scan report** - `c46f00ebf` (docs)

_No plan-metadata commit is listed separately here — see "State updates" below for the final docs commit made as part of this executor run._

## Files Created/Modified

- `.aislop/config.yml` - `ci.failBelow` changed from `70` to `95` with a calibration comment; no
  other lines touched.
- `.planning/research/aislop-scan-2026-09-11.md` - Whole-repo baseline report (Headline through
  Reproducing) plus the CI gate calibration evidence (method, results table, selection rule,
  inherited-error breakdown, long-lived-branch data points).
- `.planning/research/aislop-scan-2026-09-11.json` - Raw aislop 0.16.1 whole-repo scan output.

## Decisions Made

- `ci.failBelow: 95`, derived strictly from the nine-sample selection rule (see key-decisions in
  frontmatter for the full arithmetic and rationale).
- Bucket J was added to the baseline report (not in the plan's literal instructions but implied by
  "rules in this scan that belong to none of those buckets go under a final `## J. Other rules`")
  to hold new React-specific lint rules (`react/refs`, `react/set-state-in-effect`,
  `react/error-boundaries`, `react/incompatible-library`, `react/use-memo`,
  `react/preserve-manual-memoization`, `react/immutability`, `react/purity`,
  `react/static-components`) and `security/vulnerable-dependency` — all either new in aislop 0.16.1
  or newly non-zero (the `security` engine found 0 in the 2026-08-02 scan) — rather than folding
  them into the 2026-08-02 report's original bucket definitions, per the plan's explicit
  "same titles and rule membership as the 2026-08-02 report" instruction for buckets A-I.

## Deviations from Plan

None — plan executed exactly as written. One self-correcting fix during authoring: the initial
Headline table cited the `aislop fix` command in the "Auto-fixable" row; the plan's acceptance
criteria explicitly forbid mentioning the fix command (`grep -c 'aislop fix' == 0`, mechanical
sweeps are out of scope this phase), so the citation was removed before verification, leaving the
bare count (284). This was caught and fixed by the plan's own verify script before committing —
not a deviation from scope, just an authoring correction within Task 2.

## Issues Encountered

- `git cherry-pick` in this environment's git (2.34.1) rejects a trailing `-q`/`--quiet` flag with
  a usage error (exit 129) when combined with `-c` config overrides, silently leaving the
  cherry-pick unapplied if the exit code isn't checked. Discovered during a dry run on the first
  sample before the full calibration loop; the calibration script omits `-q` from the
  `cherry-pick` invocation (kept on `commit`, which accepts it fine). No calibration data was
  affected — this was caught before any of the nine real samples were measured.

## Next Phase Readiness

- Phase 02 (adopt a lint config and CI quality gate) is now feature-complete: pinned aislop
  devDependency + scripts (02-01), CI workflow + docs (02-02), rule config + exclusions (02-03),
  Claude Code hook (02-04), and this plan's calibrated gate + whole-repo baseline (02-05).
- The whole-repo baseline (`aislop-scan-2026-09-11.md`/`.json`) is the measurable starting point
  backlog phases 999.2-999.10 should re-measure against; each bucket heading in the report names
  its corresponding backlog item.
- `ci.failBelow: 95` and the day-one inherited-error friction (`src/index.tsx`,
  `blob-details-modal.tsx`, `package.json` dependency audit) are documented so the first real PRs
  against this repo aren't mistaken for a misconfigured gate.
- Enabling GitHub branch protection / required status check for `lint.yml` remains a manual,
  out-of-scope repo setting (D-03), unchanged by this plan.

---
*Phase: 02-adopt-a-lint-config-and-ci-quality-gate*
*Completed: 2026-09-11*

## Self-Check: PASSED

- FOUND: `.planning/research/aislop-scan-2026-09-11.md`
- FOUND: `.planning/research/aislop-scan-2026-09-11.json`
- FOUND: `.planning/phases/02-adopt-a-lint-config-and-ci-quality-gate/02-05-SUMMARY.md`
- FOUND: `.aislop/config.yml`
- FOUND commit: `d18dc81a0`
- FOUND commit: `c46f00ebf`
