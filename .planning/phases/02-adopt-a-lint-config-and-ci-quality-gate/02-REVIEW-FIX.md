---
phase: 02-adopt-a-lint-config-and-ci-quality-gate
fixed_at: 2026-09-11T21:30:00Z
review_path: .planning/phases/02-adopt-a-lint-config-and-ci-quality-gate/02-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
out_of_scope: 7
status: all_fixed
---

# Phase 2: Code Review Fix Report

**Fixed at:** 2026-09-11T21:30:00Z
**Source review:** .planning/phases/02-adopt-a-lint-config-and-ci-quality-gate/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (CR-01, WR-01 to WR-06, as selected by the maintainer)
- Fixed: 7
- Skipped: 0
- Out of scope: 7 (WR-07 declined; IN-01 to IN-06 deferred)

Fixes follow the maintainer's resolutions where they differ from REVIEW.md. The decision
amendments are recorded in `02-CONTEXT.md` (commit `659176664`,
`docs(02): amend D-01/D-02/D-05/D-09/D-13/D-15/D-16 after code review`). Nothing was pushed to
`origin` or `gh`.

## Fixed Issues

### WR-01: Telemetry is explicitly enabled

**Files modified:** `.aislop/config.yml`, `.github/workflows/lint.yml`
**Commit:** e6a3b9585
**Applied fix:**
- `telemetry.enabled: false` in `.aislop/config.yml`, with a comment.
- The `quality-gate` job in `lint.yml` now sets `AISLOP_NO_TELEMETRY: "1"` and `DO_NOT_TRACK: "1"`.
- Both variables are real opt-outs. `isTelemetryDisabled` in aislop 0.16.1
  (`node_modules/aislop/dist/cli.js:3743`) returns disabled when `AISLOP_NO_TELEMETRY === "1"` or
  `DO_NOT_TRACK === "1"`, and it checks them before the config. So both were kept.
- All three telemetry call sites (`cli.js:3766`, `23080`, `27016`) pass the loaded config, so the
  config setting alone covers local runs and the hook.
- This fix was applied and committed first, so none of the later verification scans could send
  telemetry.

### CR-01: Gate fails on every change touching `package.json` / `pnpm-lock.yaml`

**Files modified:** `.aislop/config.yml`, `AGENTS.md`
**Commit:** ed7fdca3b
**Applied fix:**
- The maintainer chose the warning downgrade, not `security.audit: false`.
  `security.audit: true` stays, and `security/vulnerable-dependency: "warning"` was added under
  `rules:` with a comment. The value is quoted to match the existing `"off"` entry.
- **Rule id.** Checked against aislop 0.16.1: audit findings use `security/vulnerable-dependency`
  (`cli.js:17436`, `17506`, `17541`, `17667`).
- **How the override applies.** `applyRuleSeverities` (`cli.js:18908`) applies `config.rules` to
  every engine's results before `hasErrors` and the exit code are computed (`cli.js:24118-24131`).
  The config still parses with the override (checked with `loadConfig`: rules, `failBelow: 95` and
  telemetry are intact).
- **A/B run** of `AISLOP_NO_HISTORY=1 aislop ci --changes --base 520155d96^`. That range includes
  the commit that added aislop to `package.json`/`pnpm-lock.yaml`.
  - Without the override: exit 1, score 98, 8 error-severity plus 4 warning
    `security/vulnerable-dependency` findings. This matches the calibration report.
  - With the override: exit 0, score 99, 12 `security/vulnerable-dependency` warnings, 0 errors.
  - No `dependency-audit-skipped` finding appeared, so the audit really ran.
- **AGENTS.md.** New bullet: changing `package.json` or `pnpm-lock.yaml` audits the whole tree;
  advisories surface as warnings and do not fail the gate; `package.json` cannot hold an
  `aislop-ignore-*` comment, so the remedy is to upgrade or override the dependency. The
  inherited-error sentence now limits rule-scoped ignores to source files.

### WR-02 + WR-03: Gate base is the merge-base with `next`; `master`/`next` pushes not gated

**Files modified:** `package.json`, `.github/workflows/lint.yml`, `AGENTS.md`
**Commit:** b90bbf4da
**Status:** fixed: requires human verification (gate-base logic; confirm on the first GitHub
Actions run for a feature-branch push and for a PR into `next`)
**Applied fix:**
- **`package.json`.** `lint:ci` is `aislop ci --changes --base "$(git merge-base origin/next HEAD)"`.
  Parsing the JSON returns exactly that string.
- **`lint.yml` trigger.**
  - The step still runs `pnpm lint:ci`, so the D-15 mirror is preserved.
  - `push.branches-ignore` is now `master`, `next`, `"changeset-release/**"`.
  - `pull_request` and `fetch-depth: 0` are unchanged.
  - No `${{ github.* }}` value is used in any `run:` line. The only expression is the existing
    `concurrency.group`.
- **Checkout comment.** The comment on the checkout step was updated. With `fetch-depth: 0`,
  `actions/checkout` fetches all branches into `refs/remotes/origin/*` for both push and
  `pull_request` events, including fork PRs, where `origin` is the base repository. So
  `origin/next` resolves in both run types. This is based on the action's documented behaviour; it
  was not run in Actions, per the no-CI constraint.
- **AGENTS.md.**
  - The script comment shows the new command.
  - The trigger bullet lists the ignored branches and says `master`/`next` content arrives
    through gated branches and PRs.
  - A new bullet explains that changed files are measured from the merge-base with `origin/next`
    ("everything is built on next until a release").
  - The remote caveat now says both remotes carry `next` but can point at different commits
    (locally `origin/next` = `8e1c3c09c`, `gh/next` = `19f980ccd`). It gives
    `git fetch origin next`, and `git fetch gh next` plus
    `pnpm exec aislop ci --changes --base "$(git merge-base gh/next HEAD)"` to reproduce CI exactly.
  - The feature-branch guidance now says to cut from `next`.
- **Local verification.**
  - `git merge-base origin/next HEAD` resolves to `8e1c3c09c`.
  - `AISLOP_NO_HISTORY=1 pnpm lint:ci`, run in the main checkout on `next` after the
    fast-forward, exited **0**: score 99, 12 `security/vulnerable-dependency` warnings, 0 errors.
  - The diff was not empty. These fix commits are not pushed, so local `next` is 7 commits ahead of
    `origin/next`, and the run scored this change set, including `package.json`. Once pushed, the
    merge-base on `next` is `HEAD` and the diff is empty, as the maintainer expected.

### WR-04: `ci.failBelow: 95` does almost nothing

**Files modified:** `.aislop/config.yml`, `AGENTS.md`, `.planning/research/aislop-scan-2026-09-11.md`
**Commit:** a95ee5c5b
**Applied fix:**
- No threshold change.
- **Config.** The trailing "calibrated" comment was replaced by a comment above
  `failBelow: 95`. It says the threshold is a backstop only: aislop 0.16.1 scores `--changes`
  against the whole-project file count (~2.1k files), so diffs score ~97-100, and the effective gate
  is "no error-severity findings in touched files". `loadConfig` still returns `failBelow: 95`.
- **AGENTS.md.** "also when the score is below `ci.failBelow`" was replaced with the same
  explanation.
- **Research doc.** A dated `### Note (2026-09-11, post code review): the score is diluted` was
  added to the calibration section. It cites `02-REVIEW.md` WR-04, the 2153-2164 "Files scored"
  figures and the 97 score for the 80-file `next` diff, and notes that the original comment was
  replaced.

### WR-05: `.claude/AISLOP.md` contradicts D-12/D-16 and names wrong config files

**Files modified:** `.claude/CLAUDE.md`
**Commit:** d118a0a4b
**Applied fix:** A `## noStrudel overrides for aislop hook feedback` section was appended after
`@AISLOP.md`. It says:
- config lives in `.aislop/config.yml` / `.aislop/rules.yml`, not `.yaml`;
- hook findings are feedback only (D-16): fix findings your own change introduces, and do not
  sweep pre-existing findings in touched files (backlog 999.2-999.10);
- rule-scoped `aislop-ignore-*` directives with `-- reason` are allowed (AGENTS.md "Inline
  ignores", D-12);
- `AGENTS.md` is canonical where they differ.

`.claude/AISLOP.md` was not edited.

### WR-06: Hand-edited `pnpm exec` hook command is reverted by reinstall

**Files modified:** `AGENTS.md`
**Commit:** 1ffd93220
**Applied fix:** Two bullets were added next to the existing hook note:
- The hook needs `pnpm install` before it works in a fresh clone.
- After re-running `aislop hook install --claude --project` (e.g. on upgrade), restore both hook
  commands in `.claude/settings.json` to `pnpm exec aislop hook claude` and
  `pnpm exec aislop hook claude --on-file-changed`. The installer rewrites them to a bare `aislop`
  that is not on PATH.

Both strings match the committed `.claude/settings.json` exactly. `aislop hook install` was not
re-run.

## Skipped Issues

None of the in-scope findings were skipped. The findings below were outside the maintainer's
selected scope and were deliberately left unchanged.

### WR-07: Hook side-effect files are not fully gitignored

**File:** `.gitignore:8-10`
**Reason:** out of scope, declined by the maintainer. `.gitignore` was left exactly as it was.
**Original issue:** `.aislop/hook.lock`, `.aislop/.aislop-tmp-*` and subdirectory `.aislop/`
side-effect files are not ignored, so they can show up in `git status` and in local
`aislop ci --changes` runs.

### IN-01: Workflow hardening gaps

**File:** `.github/workflows/lint.yml:21,27,30,36`
**Reason:** out of scope, an info finding deferred by the maintainer.
**Original issue:** Actions are pinned to tags, `pnpm install` runs allowed build scripts on PR
code, and there is no `timeout-minutes`.

### IN-02: Same-repo PR branches run the gate twice

**File:** `.github/workflows/lint.yml:3-7,12-14`
**Reason:** out of scope, an info finding deferred by the maintainer. The WR-03 trigger change does
not remove the duplicate `push` and `pull_request` runs on feature branches.
**Original issue:** A branch with an open PR triggers both `push` and `pull_request` runs in
different concurrency groups.

### IN-03: A bare directive silently suppresses every rule

**File:** `AGENTS.md:171`, `src/sw/client/error-logger.ts:1`
**Reason:** out of scope, an info finding deferred by the maintainer.
**Original issue:** A rule-less `aislop-ignore-*` directive disables every rule, and a reason
without `--` becomes bogus rule tokens. D-12 is enforced only in review.

### IN-04: A broken config silently falls back to defaults

**File:** `.aislop/config.yml`
**Reason:** out of scope, an info finding deferred by the maintainer. Each config change in this run
was checked through `loadConfig`: `failBelow: 95`, both rules, 4 excludes and
`telemetry.enabled: false` all parse. No guard step was added.
**Original issue:** `parseConfig` swallows validation errors and returns defaults, so CI would pass
on default policy.

### IN-05: Changesets release PRs never get a Lint check

**File:** `.github/workflows/lint.yml:3-7`
**Reason:** out of scope, an info finding deferred by the maintainer. The WR-03 push trigger now
ignores `changeset-release/**`. Branch-protection guidance was not added.
**Original issue:** Release PRs are opened with `GITHUB_TOKEN`, so they get no Lint status. That
matters if Lint becomes a required check.

### IN-06: aislop brings in a large dependency tree, including a new high advisory

**File:** `package.json:165`
**Reason:** out of scope, an info finding deferred by the maintainer. No packages were installed or
overridden. CR-01's warning downgrade means the `fast-uri` advisory no longer fails the gate.
**Original issue:** aislop adds ~1,800 lockfile lines and a high `fast-uri` advisory via
`@modelcontextprotocol/sdk > ajv`.

## Verification notes

- **Prettier** passes on `.aislop/config.yml`, `.github/workflows/lint.yml`, `package.json`,
  `AGENTS.md` and `.claude/CLAUDE.md`.
- **Pre-existing prettier failures.** Two edited files already failed `prettier --check` at the
  review commit `8e1c3c09c`. They were not reformatted, to keep the fixes scoped.
  - `.planning/research/aislop-scan-2026-09-11.md`: 15 hunks at HEAD and 15 after the edit, from
    table padding and list indentation. The added note passes on its own, and no hunk overlaps it.
  - `02-CONTEXT.md`: 3 hunks at HEAD and the same 3 after (two blank lines and the `*...*` footer).
    None fall in the amendment block.
- **Isolation.** All edits and commits were made in an isolated worktree
  (`/tmp/sv-02-reviewfix-DVQsPP`, temp branch `gsd-reviewfix/02-1863222`), with the main
  checkout's `node_modules` symlinked in. `next` was then fast-forwarded to `659176664`, and the
  worktree, temp branch and recovery sentinel were removed.
- **pnpm in the worktree.** Its dependency check tried a `pnpm install` through the symlink and
  aborted for lack of a TTY. It removed nothing; the main checkout's `node_modules` was confirmed
  intact. After that, all worktree commands called `node_modules/.bin` directly, and `pnpm lint:ci`
  was run only in the main checkout.
- **Local runs** all used `AISLOP_NO_HISTORY=1`, and telemetry was disabled for every run.

---

_Fixed: 2026-09-11T21:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
