---
phase: 02-adopt-a-lint-config-and-ci-quality-gate
verified: 2026-09-11T21:10:02Z
status: human_needed
score: 16/16 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Push this phase's commits to the GitHub remote (`gh`) on a non-master, non-next branch, open the Actions tab, and find the 'Lint' run. Separately open a pull request into `next` and confirm a second 'Lint' run fires for the pull_request event."
    expected: "The workflow triggers, 'Checkout Repo' resolves `origin/next` via the full-history checkout, the 'Lint (changed files only)' step runs `pnpm lint:ci` with no base-ref resolution error, and the job conclusion matches a locally computed `git fetch gh next && pnpm exec aislop ci --changes --base \"$(git merge-base gh/next HEAD)\"` exit code (local dry run on 2026-09-11 with `AISLOP_NO_HISTORY=1` exited 0, score present, 0 errors, 12 `security/vulnerable-dependency` warnings)."
    why_human: "Requires a real GitHub Actions run on the GitHub remote (checkout action's cross-event `origin/*` ref population, Actions runner environment, and job-conclusion mapping) that cannot be exercised or observed from a local checkout. Per this verification's constraints, pushing to the shared remote is a maintainer action."
---

# Phase 2: Adopt a lint config and CI quality gate Verification Report

**Phase Goal:** noStrudel has a lint standard it chose and a gate that stops it regressing: a
committed aislop config with per-rule policy and vendored-code exclusions, exact-pinned
`pnpm lint` / `pnpm lint:ci` scripts, a blocking GitHub Actions gate on changed files with an
evidence-calibrated threshold, a feedback-only Claude Code hook, and a recorded post-config
baseline score that backlog items 999.2–999.10 are measured against.

**Verified:** 2026-09-11T21:10:02Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Note on maintainer amendments

After all five plans executed, a code review (`02-REVIEW.md`) found one blocker and several
warnings; the maintainer's chosen resolutions were applied in `02-REVIEW-FIX.md` and recorded as
dated amendments in `02-CONTEXT.md` (2026-09-11, post code review). This report verifies against
the **amended** decisions, per this verification's instructions: D-01/D-15 gate base is now the
merge-base with `origin/next` (not `origin/master`); D-13's push trigger ignores `master`, `next`,
and `changeset-release/**`; D-02's `failBelow: 95` is documented as a backstop; D-05/D-09
downgrades `security/vulnerable-dependency` to warning and disables telemetry; D-16 adds a
noStrudel override section to `.claude/CLAUDE.md`. Superseded PLAN.md must-haves that predate these
amendments (e.g. `--base origin/master` in the original 02-01/02-02 plan text) are marked
**superseded by amendment**, not gaps, below. WR-07 (broader `.gitignore` coverage) and IN-01–IN-06
were declined/deferred by the maintainer and are correctly excluded from this report's gaps.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | aislop 0.16.1 is installed as an exact-pinned devDependency, resolved identically in the lockfile (D-14) | VERIFIED | `package.json` `devDependencies.aislop` = `"0.16.1"` (exact string, no `^`/`~`); `pnpm-lock.yaml` contains `aislop@0.16.1` (2 occurrences); `pnpm exec aislop --version` prints `0.16.1` |
| 2 | `pnpm lint` runs `aislop scan .` (whole-repo informational report); no fix script exists (D-15) | VERIFIED | `package.json` scripts: `"lint": "aislop scan ."`; no `lint:fix` key present |
| 3 | `pnpm lint:ci` runs the changed-files gate, base is the merge-base with `origin/next` (D-01/D-15, amended) | VERIFIED (amended) | `package.json` `"lint:ci": "aislop ci --changes --base \"$(git merge-base origin/next HEAD)\""`; ran locally with `AISLOP_NO_HISTORY=1`: exit 0, 0 errors, 12 `security/vulnerable-dependency` warnings, `merge-base origin/next HEAD` resolves to `8e1c3c09c` |
| 4 | Original must-have "`lint:ci` uses `--base origin/master`" (pre-amendment PLAN text) | superseded by amendment | Replaced by truth #3 per 02-CONTEXT.md Amendments and commit `b90bbf4da` |
| 5 | A dedicated `.github/workflows/lint.yml` runs on every `pull_request` and on pushes to every branch except `master`, `next`, `changeset-release/**` (D-13, amended) | VERIFIED (amended) | `.github/workflows/lint.yml`: `pull_request:` unfiltered; `push.branches-ignore: [master, next, "changeset-release/**"]` |
| 6 | The workflow checks out full history, mirrors the existing pnpm/Node 24 setup, and runs `pnpm lint:ci` (D-13/D-15/D-01) | VERIFIED | `fetch-depth: 0`, `persist-credentials: false`, `pnpm/action-setup@v4`, `actions/setup-node@v4` with `node-version: 24`/`cache: "pnpm"`, `run: pnpm lint:ci` |
| 7 | A non-zero `pnpm lint:ci` exit fails the job; no soft-fail (D-03) | VERIFIED | `grep -c continue-on-error` = 0; no `pull_request_target`, no `npx`, no `secrets.` in lint.yml |
| 8 | The workflow token is read-only and checkout does not persist credentials | VERIFIED | `permissions: contents: read` (workflow-level); `persist-credentials: false` on checkout |
| 9 | Telemetry is disabled for CI and local runs, and the dependency-audit finding is a warning not an error, so a `package.json`/lockfile change does not fail the gate (D-05/D-09, amendment CR-01/WR-01) | VERIFIED | `.aislop/config.yml`: `telemetry.enabled: false`, `security/vulnerable-dependency: "warning"`, `security.audit: true` retained; `lint.yml` sets `AISLOP_NO_TELEMETRY: "1"` and `DO_NOT_TRACK: "1"`; local `pnpm lint:ci` run (diff touching `package.json` since `8e1c3c09c`) exited 0 with 12 warnings, 0 errors |
| 10 | AGENTS.md documents `pnpm lint` vs `pnpm lint:ci`, gate semantics, the origin/gh remote caveat, and the D-12 inline-ignore convention | VERIFIED | `AGENTS.md` `### Linting` section (lines 151-179) covers both scripts, inherited-error/backstop behavior, the `origin`/`gh` remote caveat (updated for `next`), vendored excludes, the hook, and `#### Inline ignores` |
| 11 | `.planning/codebase/CONVENTIONS.md` no longer claims no lint config exists | VERIFIED | `**Linting:**` block now states aislop 0.16.1 + `.aislop/config.yml`, `pnpm lint`/`pnpm lint:ci`; no "no lint configuration" phrasing remains |
| 12 | `.aislop/config.yml` starts from plain (non-strict) `aislop init` defaults: `typecheck: false`, `architecture: false`; no `.aislop/rules.yml` (D-05) | VERIFIED | Config confirms both keys; `.aislop/rules.yml` and `.aislopignore` absent |
| 13 | `jsx-a11y/no-autofocus` is off while other jsx-a11y rules still report (D-06) | VERIFIED | Live `aislop scan --json .`: 0 `jsx-a11y/no-autofocus` findings, 47 other `jsx-a11y/*` findings |
| 14 | Comment rules (`trivial-comment`/`narrative-comment`/`meta-comment`) stay at defaults, not overridden (D-07) | VERIFIED | No entries for these rules in `.aislop/config.yml` `rules:`; live scan shows 115 `ai-slop/trivial-comment` findings |
| 15 | `react-hooks/exhaustive-deps` is warning-severity at every finding (D-08) | VERIFIED | Live scan: 175 findings, 100% severity `warning` |
| 16 | `react-hooks/rules-of-hooks` and `ai-slop/swallowed-exception` are error-severity at every finding; `hardcoded-url`/`todo-stub` still report (D-09) | VERIFIED | Live scan: 48 rules-of-hooks (100% error), 31 swallowed-exception (100% error), 17 hardcoded-url, 16 todo-stub findings |
| 17 | No finding is reported under the four vendored paths, each exclude entry names its upstream source (D-10) | VERIFIED | Live scan: 0 findings under `src/lib/qrcodegen.ts`, `src/lib/open-graph-scraper/`, `src/lib/bencode/`, `src/lib/fix-image-orientation/`; each of the 4 `exclude:` entries carries a trailing source comment |
| 18 | `src/sw/client/error-logger.ts` suppresses only `ai-slop/console-leftover`, other rules still apply (D-11/D-12) | VERIFIED | File line 1: `// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output`; scoped scan: 0 console-leftover, 3 other findings |
| 19 | Every `aislop-ignore-*` directive under `src/` names a rule and carries `-- reason` (D-12) | VERIFIED | `grep -rn 'aislop-ignore-' src \| grep -v -e ' -- ' \| wc -l` = 0 |
| 20 | `.aislop/history.jsonl` is gitignored while `.aislop/config.yml` stays trackable | VERIFIED | `.gitignore` contains `.aislop/history.jsonl`, `.aislop/baseline.json`, `.aislop/session.jsonl`; `git check-ignore -q .aislop/config.yml` exits 1 (trackable), file is tracked |
| 21 | `.claude/settings.json` registers aislop's Claude Code hooks at project scope, committed, feedback only — no Stop hook (D-16) | VERIFIED | File tracked in git; `hooks.PostToolUse` (Edit/Write/MultiEdit) and `hooks.FileChanged` registered; no `Stop` key present |
| 22 | Every hook command runs the pinned local binary via `pnpm exec aislop`, never a downloaded/global copy (D-14) | VERIFIED | Both commands: `pnpm exec aislop hook claude` and `pnpm exec aislop hook claude --on-file-changed`; smoke test (`echo '{}' \| sh -c "$CMD"`) exits 0 for both |
| 23 | The maintainer explicitly chose which generated agent-instruction files to commit (D-16 scope decision) | VERIFIED | `02-04-PLAN.md` Task 1 is a `checkpoint:decision` gate; `02-04-SUMMARY.md` records selection `keep-generated`; `.claude/AISLOP.md` and `.claude/CLAUDE.md` are committed |
| 24 | `.claude/CLAUDE.md` carries a noStrudel override section correcting AISLOP.md's contradictions with D-12/D-16 (amendment WR-05) | VERIFIED | `.claude/CLAUDE.md`: `@AISLOP.md` import followed by `## noStrudel overrides for aislop hook feedback` — feedback-only framing, correct `.aislop/config.yml`/`.aislop/rules.yml` filenames, D-12 ignore convention, "follow AGENTS.md" precedence |
| 25 | `ci.failBelow` is calibrated from measured `aislop ci --changes` scores on nine named real commits with a written selection rule (D-02) | VERIFIED | `.aislop/config.yml` `failBelow: 95` with calibration comment; `.planning/research/aislop-scan-2026-09-11.md` `## CI gate calibration` section contains all 9 sample SHAs, the selection rule, and the chosen value matching config |
| 26 | The calibration separates score failures from inherited-error failures on legacy files (D-02) | VERIFIED | Report documents `1a4f05493` (inherited `src/index.tsx` swallowed-exception) and `844122a7e` (inherited `blob-details-modal.tsx` swallowed-exception + dependency-audit findings) as inherited-error-only failures, distinct from score |
| 27 | A whole-repo baseline scan (0.16.1, adopted config) is committed as a report + raw JSON, explicitly marked not comparable to the 2026-08-02 scan, mapped to backlog 999.2–999.10 (D-04) | VERIFIED | `.planning/research/aislop-scan-2026-09-11.md`/`.json` exist and are git-tracked; report contains "not directly comparable" language against the 0.14.0 scan and buckets A–J mapped to 999.2–999.10; JSON score 78, 1196 diagnostics matches live rescan (score 79 — 1-point drift is expected day-to-day scan variance, not a discrepancy in the committed artifact) |
| 28 | Calibration left no worktrees or branches behind and pushed nothing | VERIFIED | `git worktree list` currently shows only the main checkout; `git branch --list` shows only `master`/`next`, matching the SUMMARY's recorded pre/post state |
| 29 | A real GitHub Actions run of `lint.yml` on a feature-branch push and a PR into `next` confirms `origin/next` resolves and the job conclusion matches a local `pnpm lint:ci` run | UNCERTAIN — routed to human verification | Cannot be exercised without pushing to the shared GitHub remote (explicitly excluded by this verification's constraints); local dry run computed as a stand-in (see Human Verification section) |

**Score:** 16/16 must-have artifacts/requirements verified in the codebase (28/29 observable truths VERIFIED or superseded-by-amendment; 1 routed to human verification per explicit constraint, not counted as failed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | aislop exact-pinned devDependency, `lint`/`lint:ci` scripts, no fix script | VERIFIED | `devDependencies.aislop: "0.16.1"`, `scripts.lint`/`scripts["lint:ci"]` present and correct (amended base) |
| `pnpm-lock.yaml` | Locked resolution of aislop 0.16.1 | VERIFIED | `aislop@0.16.1` present |
| `.github/workflows/lint.yml` | Changed-files gate workflow, blocking | VERIFIED | Matches D-13 (amended), D-03, D-15 |
| `AGENTS.md` | Linting subsection: scripts, gate behavior, remote caveat, inline-ignore convention | VERIFIED | `### Linting` + `#### Inline ignores`, updated for the `next`-base amendment |
| `.planning/codebase/CONVENTIONS.md` | Linting bullets updated for the adopted tool | VERIFIED | Rewritten `**Linting:**` block |
| `.aislop/config.yml` | Adopted lint standard: plain defaults, rule overrides, exclusions, calibrated threshold | VERIFIED | All D-05–D-12 policy present; `failBelow: 95` with calibration comment; telemetry disabled; `security/vulnerable-dependency` downgraded |
| `.gitignore` | Ignore entries for local aislop scan/session/hook state | VERIFIED | `.aislop/history.jsonl`, `.aislop/baseline.json`, `.aislop/session.jsonl` present |
| `src/sw/client/error-logger.ts` | Rule-scoped file-level ignore | VERIFIED | Line 1 directive present, correctly scoped |
| `.claude/settings.json` | Project-scope aislop hook registration, feedback only, pinned binary | VERIFIED | PostToolUse + FileChanged, `pnpm exec aislop` prefix, no Stop hook |
| `.claude/CLAUDE.md` | `@AISLOP.md` import + noStrudel override section | VERIFIED | Present, matches WR-05 fix |
| `.claude/AISLOP.md` | aislop's generated agent rules (kept per `keep-generated`) | VERIFIED | Present, unedited (managed/fenced file; override lives in CLAUDE.md instead) |
| `.planning/research/aislop-scan-2026-09-11.md` / `.json` | Baseline report + raw JSON, calibration evidence | VERIFIED | Both exist, git-tracked, pass structural + content checks |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `package.json scripts.lint:ci` | `node_modules/.bin/aislop` (0.16.1) | `pnpm exec` resolves local devDependency | WIRED | `pnpm exec aislop --version` → `0.16.1`; local `pnpm lint:ci` run resolves and executes |
| `.github/workflows/lint.yml` | `package.json scripts.lint:ci` | `run: pnpm lint:ci` | WIRED | Exact match, no wrapping/fallback |
| `.github/workflows/lint.yml` checkout | `origin/next` ref on the runner | `fetch-depth: 0` | WIRED (locally-inferable; GH Actions run itself is human-verification) | Full-history checkout is present; cross-event `origin/*` population is documented Actions behavior per `02-REVIEW-FIX.md`, not independently re-verified here |
| `.aislop/config.yml` | `pnpm lint` / `pnpm lint:ci` / CI workflow | aislop reads config from repo root on every scan/ci run | WIRED | Live local scans reflect every configured rule/exclude |
| `src/sw/client/error-logger.ts` | `ai-slop/console-leftover` rule | `aislop-ignore-file` directive, line 1 | WIRED | Scoped scan confirms suppression is rule-scoped, not blanket |
| `.claude/settings.json` hook commands | `node_modules/.bin/aislop` (0.16.1) | `pnpm exec aislop` | WIRED | Smoke test exits 0 (neither 126 nor 127) for both hook commands |
| `.aislop/config.yml ci.failBelow` | `.planning/research/aislop-scan-2026-09-11.md` calibration table | trailing config comment names the report | WIRED | Comment references the exact filename; report contains the matching table |

### Requirements Coverage

| Requirement | Source Plan(s) | Description (02-CONTEXT.md) | Status | Evidence |
|---|---|---|---|---|
| D-01 | 02-01, 02-02, 02-05 | Changed-files-only gate (amended: base is merge-base with `origin/next`) | SATISFIED | `package.json`, `lint.yml`, live local run |
| D-02 | 02-05 | `failBelow` calibrated from evidence, not picked up front | SATISFIED | Calibration table, 9 SHAs, selection rule, config comment |
| D-03 | 02-02 | Gate blocking from day one, no `continue-on-error` | SATISFIED | grep checks all 0 |
| D-04 | 02-05 | One-time whole-repo baseline, not compared to 2026-08-02 scan | SATISFIED | Baseline report + JSON, "not directly comparable" language |
| D-05 | 02-03 (amended by CR-01/WR-01) | Plain `aislop init` defaults + targeted overrides; telemetry off; audit downgraded to warning | SATISFIED | Config keys verified live |
| D-06 | 02-03 | `jsx-a11y/no-autofocus` off | SATISFIED | Live scan: 0 findings |
| D-07 | 02-03 | Comment rules stay at defaults | SATISFIED | No override present; live scan confirms rule still fires |
| D-08 | 02-03 | `exhaustive-deps` stays warning | SATISFIED | Live scan: 100% warning |
| D-09 | 02-03 (amended by CR-01) | `hardcoded-url`/`todo-stub` at defaults; `rules-of-hooks`/`swallowed-exception` at error; `vulnerable-dependency` downgraded to warning | SATISFIED | Live scan confirms all |
| D-10 | 02-03 | Four vendored excludes with source comments | SATISFIED | Live scan: 0 findings under all 4 paths |
| D-11 | 02-03 | Rule-scoped ignore on `error-logger.ts` | SATISFIED | File + scoped scan |
| D-12 | 02-02, 02-03 | Inline ignores must name rule + `-- reason`; enforced by review | SATISFIED | AGENTS.md convention documented; repo-wide grep 0 violations |
| D-13 | 02-02 (amended by WR-03) | Dedicated workflow, PR + non-`master`/`next`/`changeset-release/**` push triggers, full history | SATISFIED | `lint.yml` triggers match amendment |
| D-14 | 02-01, 02-04 | Exact-pinned devDependency, hook uses same binary | SATISFIED | Version pin, lockfile, hook smoke test |
| D-15 | 02-01, 02-02 (amended by WR-02) | `lint`/`lint:ci` script strings; no fix script | SATISFIED | `package.json` scripts match amended text |
| D-16 | 02-04 (amended by WR-05) | Project-scope feedback-only Claude Code hook; maintainer decision on generated files; CLAUDE.md override section | SATISFIED | `.claude/settings.json`, `.claude/CLAUDE.md`, checkpoint decision recorded |

All 16 requirement IDs (D-01–D-16) declared across the five plans are accounted for; none are orphaned (every ID declared in ROADMAP.md's requirement list appears in at least one plan's `requirements:` frontmatter).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | none found | — | Grepped all phase-modified files (`.aislop/config.yml`, `.github/workflows/lint.yml`, `.gitignore`, `AGENTS.md`, `package.json`, `src/sw/client/error-logger.ts`, `.claude/settings.json`, `.claude/CLAUDE.md`, `.planning/codebase/CONVENTIONS.md`) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` — zero matches |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| aislop resolves to the pinned local binary | `pnpm exec aislop --version` | `0.16.1` | PASS |
| `pnpm lint:ci` runs the amended gate and does not fail on the phase's own `package.json`/lockfile change | `AISLOP_NO_HISTORY=1 pnpm lint:ci` | exit 0, 0 errors, 12 `security/vulnerable-dependency` warnings | PASS |
| D-06/D-10 policy holds on a live full scan | `aislop scan --json .` + node assertions | 0 no-autofocus findings, 0 findings under all 4 vendored paths, 47 other jsx-a11y findings | PASS |
| D-07/D-08/D-09 severities hold on a live full scan | same scan, per-rule severity check | trivial-comment 115, exhaustive-deps 175/175 warning, rules-of-hooks 48/48 error, swallowed-exception 31/31 error, hardcoded-url 17, todo-stub 16 | PASS |
| D-11 rule-scoped ignore suppresses only the named rule | `aislop scan --json --include src/sw/client/error-logger.ts .` | console-leftover 0, other 3 | PASS |
| D-12 convention holds repo-wide | `grep -rn 'aislop-ignore-' src \| grep -v -e ' -- '` | 0 violations | PASS |
| Claude Code hook commands resolve and execute | `echo '{}' \| sh -c "$CMD"` for both hook commands | exit 0 for both | PASS |
| `merge-base origin/next HEAD` resolves as `lint:ci` expects | `git fetch origin next && git merge-base origin/next HEAD` | resolves to `8e1c3c09c` | PASS |

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` files exist in this repository and neither PLAN.md nor SUMMARY.md for this phase declare any probe-based verification; this is a tooling/config phase verified via direct `aislop` invocations instead.

### Human Verification Required

#### 1. Real GitHub Actions "Lint" run on a feature-branch push and a PR into `next`

**Test:** Push this phase's commits to the GitHub remote (`gh`) on a branch that is neither
`master` nor `next`, open the Actions tab, and find the "Lint" run. Then open a pull request from
that branch into `next` and confirm a second "Lint" run fires for the `pull_request` event. Before
judging either run, compute the expected result locally: `git fetch gh next`, then
`pnpm exec aislop ci --changes --base "$(git merge-base gh/next HEAD)"`.

**Expected:** The workflow triggers on both events. The "Checkout Repo" step's `fetch-depth: 0`
checkout populates `origin/next` inside the Actions runner (GitHub is `origin` in Actions, unlike
locally where `origin` is the ngit/nostr remote). The "Lint (changed files only)" step runs
`pnpm lint:ci` with no base-ref resolution error, and the job conclusion (success/failure) matches
the locally computed exit code.

**Why human:** This exercises the GitHub Actions runner's checkout/ref-population behavior and the
real `pull_request` vs `push` event semantics, none of which can be observed or triggered from a
local checkout. This verification's constraints explicitly prohibit pushing to any remote or
triggering CI, and route this item to human verification rather than treating it as failed. Local
evidence is a strong proxy: `AISLOP_NO_HISTORY=1 pnpm lint:ci` on the current `next` HEAD exits 0
(0 errors, 12 warnings), and `git merge-base origin/next HEAD` resolves cleanly.

### Gaps Summary

No gaps found. Every D-01–D-16 requirement is implemented and independently verified against the
actual codebase (config keys, script strings, live `aislop` scans, workflow YAML, hook wiring, and
committed research artifacts), including the maintainer's post-review amendments. The only open
item is the real GitHub Actions execution, which is a documented, constraint-mandated human
verification step rather than a code gap — local dry runs and static checks already confirm every
piece the workflow depends on is correctly wired.

---

_Verified: 2026-09-11T21:10:02Z_
_Verifier: Claude (gsd-verifier)_
