---
phase: 02-adopt-a-lint-config-and-ci-quality-gate
reviewed: 2026-09-11T18:48:20Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - .aislop/config.yml
  - .claude/AISLOP.md
  - .claude/CLAUDE.md
  - .claude/settings.json
  - .github/workflows/lint.yml
  - .gitignore
  - AGENTS.md
  - package.json
  - src/sw/client/error-logger.ts
findings:
  critical: 1
  warning: 7
  info: 6
  total: 14
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-09-11T18:48:20Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Scope: the phase diff `f88fb6013..HEAD` for the nine listed files. I checked the claims against
the installed `aislop@0.16.1` code (`node_modules/aislop/dist/cli.js`) and did not take the
config at face value. I also ran read-only checks against the repo: git diff counts, the
committed config parsed through aislop's own `loadConfig`, and `pnpm audit --json`.

What holds up:
- **Workflow security.** Triggers are `pull_request`/`push` only, with no `pull_request_target`.
  The token is `contents: read`, `persist-credentials: false` is set, no secrets are used, and no
  `${{ }}` values are put into `run:` shell lines. A fork PR runs untrusted code with a read-only
  token and nothing to steal.
- **Hook commands.** They are fixed strings. Stdin is parsed as JSON inside aislop and never
  reaches a shell, so there is no injection path.
- **The service-worker ignore.** The directive in `error-logger.ts` is parsed correctly:
  `parseDirective` splits on `--`, so only the token `ai-slop/console-leftover` is kept.
- **The config itself.** It passes aislop's schema: `loadConfig` returns `failBelow: 95`, the
  four excludes, and `jsx-a11y/no-autofocus: off`.
- **Supply chain.** aislop has no install scripts, and its lockfile entry has an integrity hash.

What is broken, in short:
- **Any change to `package.json` or `pnpm-lock.yaml` fails the gate for good.** That includes
  the change that lands this phase (CR-01).
- **Telemetry is on in CI.** The committed config turns it on explicitly, which also switches off
  aislop's own opt-out for CI runs (WR-01).
- **The changed-files set and the score threshold don't behave as documented** (WR-02, WR-03,
  WR-04).
- **The agent instructions pushed into every Claude session contradict D-12 and D-16.** They also
  name config files that don't exist (WR-05).

## Critical Issues

### CR-01: Gate fails on every change touching `package.json` / `pnpm-lock.yaml`, including this phase's own change, and there is no way around it

**File:** `.aislop/config.yml:17-19` (`security.audit: true`), `.github/workflows/lint.yml:38-39`, `AGENTS.md:162`
**Issue:**
In `--changes` mode, aislop runs a dependency audit whenever a changed file matches
`DEPENDENCY_AUDIT_INPUT_FILE_RE` (`package.json`, `pnpm-lock.yaml`, …). The relevant code is
`collectScanFileScope` (`dependencyAuditScope: "files"`) and `shouldRunDependencyAudit`
(`cli.js:17873`).

The audit covers the whole project:
- `pnpm audit --json` returns the legacy `advisories` format.
- `parseLegacyAdvisories` (`cli.js:17698`) takes no manifest, so devDependency advisories are not
  filtered out.
- `toSeverity` maps `high`/`critical` to `error`.
- `computeScanExitCode` exits 1 on any error, whatever the score (`cli.js:23621`).

Current state of the repo (`pnpm audit`): **38 high and 1 critical** advisories.
- They come from `tar`, `minimatch` and `sharp` via the `@capacitor/assets` devDependency.
- One more, `fast-uri` (high), comes in through `aislop > @modelcontextprotocol/sdk > ajv`, i.e.
  from the devDependency this phase added.

Consequences:
1. **This phase's own change fails its gate.** This phase adds `"aislop": "0.16.1"` to
   `package.json`, so the PR or push that lands it cannot go green. The calibration report
   (`.planning/research/aislop-scan-2026-09-11.md:377-388`) already measured exit 1 with
   8 `security/vulnerable-dependency` errors on both bases.
2. **Every dependency bump, lockfile refresh or version edit fails** until every transitive
   high/critical advisory in the whole tree is fixed. That is unrelated to the change being
   gated, and the backlog phases don't cover it.
3. **The documented escape hatch doesn't work.** AGENTS.md:162 says "fix them or add a
   rule-scoped ignore with a reason". The findings are reported on `package.json`, which is JSON
   and cannot hold an `aislop-ignore-*` comment.
4. **The gate is non-deterministic and depends on the network:**
   - A manifest change that passes today fails tomorrow when an advisory is published, with no
     code change.
   - If the registry call fails or passes the 25 s `auditTimeout`, aislop records only an
     info-level `dependency-audit-skipped` and the gate *passes*.

   This undermines the determinism D-14 pins the version to protect.

The calibration treated this as "expected audit behavior". But the phase goal is a gate that
stops regressions, and D-03 makes it blocking. As configured, it blocks a whole class of normal
changes on pre-existing, unrelated dependency state.

**Fix:** Move dependency auditing out of the blocking gate. The smallest option consistent with
D-05/D-09 is to turn off the engine-level audit, since it is an engine setting, not one of the
rules D-09 covers. Record the decision change in CONTEXT.
```yaml
security:
  audit: false # dependency advisories are pre-existing tree-wide state, not a property of the diff; audited separately
  auditTimeout: 25000
```
Alternatively, keep the audit but make it non-blocking:
```yaml
rules:
  security/vulnerable-dependency: warning # reported, but a transitive advisory must not block unrelated changes
```
Either way:
- Correct the AGENTS.md:162 remediation text.
- If advisory tracking is still wanted, add a separate non-required `pnpm audit --prod` job.

## Warnings

### WR-01: Telemetry is explicitly enabled, which overrides aislop's own opt-out for CI and sends data from CI, contributor machines and every Claude edit

**File:** `.aislop/config.yml:36-37`
**Issue:**
`isTelemetryDisabled` (`cli.js:3743-3750`) checks `config.enabled === true` and returns "enabled"
*before* its `CI === "true"` opt-out. With `telemetry.enabled: true` committed, three things send
data:
- **Every GitHub Actions run of `pnpm lint:ci`,** including fork PRs.
- **Every local `pnpm lint`.**
- **Every Claude Code edit hook** (`hook_scan_completed`, `cli.js:19479`).

Each one POSTs to `https://eu.i.posthog.com/capture/` with:
- a persistent `anonymous_install_id`, written to `~/.aislop/install_id` or
  `$XDG_STATE_HOME/aislop/install_id`;
- OS, arch, Node version, package manager and `is_ci`;
- the command, language set and file-count bucket;
- score, finding, error and warning counts, and per-engine issue counts and timings.

The properties are allow-listed, so no source code or paths are sent. Still, this is undisclosed
third-party data sent from the project's CI and from every contributor who runs the scripts or
uses the committed hook. None of D-01…D-16 or AGENTS.md mentions it.

Removing the key does not help: the schema default is also `enabled: true` (`cli.js:3392`), so
only an explicit `false` or an environment variable turns it off.

**Fix:**
```yaml
telemetry:
  enabled: false # no third-party usage reporting from CI, contributor machines or the agent hook
```
and, as defence in depth in `.github/workflows/lint.yml`:
```yaml
env:
  AISLOP_NO_TELEMETRY: "1"
  DO_NOT_TRACK: "1"
```
If telemetry is deliberately kept on, say so in AGENTS.md.

### WR-02: `--changes --base origin/master` diffs against the tip of master (two-dot), not the merge-base, so stale branches are gated on master's code

**File:** `package.json:20`, `.github/workflows/lint.yml:5-7,38-39`
**Issue:**
`getChangedFiles` runs `git diff --name-only --diff-filter=ACMR <base>` against the working tree
(`cli.js:23365-23393`), and `getChangedLineMap` does the same. There is no `merge-base`.

For a branch that is *behind* master, the result differs from what the gate is meant to check:
- **Files master modified after the branch point show up as `M`.** They are scored, and their
  pre-existing error findings fail the branch.
- **Files master added show up as deletions** and are silently dropped.

D-13 keeps branch-push runs specifically for contributions that arrive via ngit and not as GitHub
PRs, and those branches are typically not rebased. So the gate fails them on code they never
touched, and the failure looks like "inherited errors in a touched file".

`pull_request` runs mostly hide this, because they check out the merge commit. They still drift
if master moves between the merge-ref computation and the checkout. AGENTS.md:164 only warns
about "every unmerged commit" and doesn't describe this failure mode.

**Fix:** Keep D-01's meaning ("files changed relative to master") but diff from the merge-base:
```json
"lint:ci": "aislop ci --changes --base \"$(git merge-base origin/master HEAD)\""
```
pnpm runs scripts through `sh` on Linux and macOS, so this works both locally and in CI.
Alternatively, compute the merge-base in a workflow step and pass it with `pnpm exec aislop ci`.
Update AGENTS.md:163-164 to match.

### WR-03: The push trigger includes `next`, and PRs into `next` are gated against master, so the main integration branch and every PR into it are red for content they didn't change

**File:** `.github/workflows/lint.yml:3-7`, `package.json:20`
**Issue:**
`branches-ignore: [master]` lets `next` through. `next` is the active integration branch: the
current branch, with `gh/next` and `origin/next` present, and 76 commits and 83 changed files
ahead of `gh/master`.

Every push to `next` scores that entire unreleased diff. The calibration report
(`aislop-scan-2026-09-11.md:377-388`) records exit 1 with 9 errors, so `next` will stay red until
it is merged to master.

A `pull_request` into `next` is also scored against `origin/master`. Its merge commit contains
all of `next`, so a clean one-line PR into `next` inherits the same 9 errors and fails.
AGENTS.md:164 tells people to run the gate locally from a branch cut from master, but the
workflow enforces it on `next` pushes and PRs targeting `next` anyway.

A permanently red check on the default working branch teaches contributors to ignore it, which
defeats D-03. D-13 locked the "all branches except master" trigger, but it did not consider this
consequence.

**Fix:**
- Diff each PR against its own target branch.
- Stop gating long-lived integration branches on push.

```yaml
on:
  pull_request:
  push:
    branches-ignore:
      - master
      - next
      - "changeset-release/**"
```
```yaml
      - name: Lint (changed files only)
        env:
          BASE_REF: ${{ github.base_ref || 'master' }}
        run: pnpm exec aislop ci --changes --base "$(git merge-base "origin/$BASE_REF" HEAD)"
```
`BASE_REF` is passed through `env`, not interpolated into the script, to avoid injection.
If D-13/D-15 must stay verbatim, amend CONTEXT and record that `next` is expected to be red.

### WR-04: `ci.failBelow: 95` does almost nothing; the score is diluted across the whole project even in `--changes` mode

**File:** `.aislop/config.yml:34`, `AGENTS.md:162`
**Issue:**
In `--changes` mode, `collectScanFileScope` still sets
`scoreFileCount = projectSourceFiles.length + projectTestFiles.length` (`cli.js:23646-23663`).
That is about 2,160 files, not the changed set. `calculateScore` then divides the deductions by
`(2160 + 5)` (`cli.js:18868+`).

The calibration data shows the effect:
- The table lists "Files scored 2153–2164" for single-commit diffs.
- Every sample scored 98–100.
- The 80-file `next` diff, with **9 errors and 37 warnings**, still scored **97**.

A diff would need a huge number of findings to drop below 95. The threshold also gets weaker as
the repo grows. In practice the gate is just "zero error-severity findings in touched files".
Warnings, which cover most of the adopted policy (D-07 comments, D-08 exhaustive-deps, D-09
todo-stub and hardcoded-url), can never fail it.

This makes three things misleading:
- the config comment ("calibrated … from sampled commits");
- AGENTS.md:162 ("also when the score is below `ci.failBelow`");
- D-02, which assumes the score measures the diff.

The calibration measured a dilution effect, not typical change quality.

**Fix:** At minimum, record the real behaviour so nobody relies on the threshold as a warning
ratchet:
```yaml
ci:
  failBelow: 95 # backstop only: aislop 0.16.1 scores --changes against the whole-project file count (~2.1k), so diffs score ~97-100; the effective gate is "no error-severity findings"
```
- Update AGENTS.md:162 to say the same.
- Add a note to the research doc.
- If warnings are meant to ratchet, it needs a different mechanism, for example promoting the
  chosen rules to `error` for touched files. That is a new decision.

### WR-05: `.claude/AISLOP.md`, imported into every Claude session, contradicts D-12/D-16 and AGENTS.md and points at config files aislop never reads

**File:** `.claude/AISLOP.md:5,13-15,19-20,25-27`, `.claude/CLAUDE.md:1`
**Issue:**
`.claude/CLAUDE.md` does `@AISLOP.md`, so this text is loaded into every agent session for the
repo. It conflicts with the policy this phase wrote down:
- **Wrong file names (lines 19-20).** It points to `.aislop/config.yaml` and
  `.aislop/rules.yaml`, but aislop only reads `config.yml` and `rules.yml`
  (`CONFIG_FILE`/`RULES_FILE`, `cli.js:3490-3491`). An agent told to "open this file and follow
  it", or to add architecture rules there, creates a file aislop silently ignores.
- **Blocking language (lines 5, 13-14).** "Treat its findings as blocking", "`error` — MUST fix
  this turn" and "`warning` + `fixable: true` — MUST fix this turn" contradict D-16 (feedback
  only) and AGENTS.md:167 ("CI is the single enforcement point"). The hook reports *inherited*
  findings for the whole touched file, so any edit to a legacy file tells the agent to fix
  unrelated legacy code that same turn. Those are exactly the drive-by mechanical sweeps that
  D-15 and the deferred `lint:fix` avoid, and they belong to backlog 999.2–999.10.
- **No ignores (lines 25-26).** "Do not disable rules to pass the scan" / "If a finding is a false
  positive, leave it" contradicts D-12, which allows rule-scoped inline ignores with a reason and
  is documented in AGENTS.md:169-175.
- **Mismatched field names (lines 9 and 27).** Line 9 calls the field `suggestedActions` and line
  27 calls it `nextSteps[]`.

**Fix:** The fenced block is managed and hash-stamped, so `aislop hook install` will overwrite
edits inside it. Put the project override outside the fence, in `.claude/CLAUDE.md` after the
import:
```markdown
@AISLOP.md

## noStrudel overrides for aislop hook feedback
- Config lives in `.aislop/config.yml` / `.aislop/rules.yml` (not `.yaml`).
- Hook findings are feedback only (D-16). Fix findings introduced by your own change; do not sweep
  pre-existing findings in touched files — those belong to backlog 999.2–999.10.
- Rule-scoped `aislop-ignore-*` directives with `-- reason` are allowed (AGENTS.md "Inline ignores").
```

### WR-06: The hand-edited `pnpm exec` hook command gets reverted by any reinstall, falling back to an unpinned or missing binary

**File:** `.claude/settings.json:9,25` (with the `__aislop` sentinels at lines 10-14 and 26-30)
**Issue:**
The committed commands were changed from aislop's generated `aislop hook claude` to
`pnpm exec aislop hook claude`, which is what makes the hook use the pinned binary. The entries
still carry the `__aislop` sentinel, though. Its `hash` covers the original bare command
(`buildHookGroup$1`, `cli.js:19984-20000`).

`upsertHookGroup` (`cli.js:19938-19947`) removes *every* group containing an `__aislop` key and
re-adds the generated one. That happens on any `aislop hook install --claude --project`, for
example during the explicit upgrade D-14 expects, or to refresh AISLOP.md. The result:
- It silently goes back to bare `aislop hook claude`, which is not on PATH because aislop is a
  devDependency.
- Every edit then gets a non-blocking "command not found" and the feedback quietly stops.
- Or, if a developer has a global aislop, the hook runs an unpinned version whose scores differ
  from CI, defeating D-14.

The stale hash also means the sentinel no longer describes the committed command. Separately, in
a fresh clone without `pnpm install`, `pnpm exec aislop` fails on every Edit/Write.

**Fix:** Document the step next to the hook note in AGENTS.md:167:
```markdown
- After re-running `aislop hook install --claude --project` (e.g. on upgrade), restore both hook
  commands in `.claude/settings.json` to `pnpm exec aislop hook claude[ --on-file-changed]`; the
  installer rewrites them to a bare `aislop` that is not on PATH.
```
Also add a `pnpm lint:ci`-adjacent check (grep) or a review checklist item. Alternatively, drop
the `__aislop` sentinel so the entries are hand-owned, but then check that reinstall doesn't add
duplicates.

### WR-07: Hook side-effect files are not fully gitignored (`hook.lock`, temp files, subdirectory `.aislop/`)

**File:** `.gitignore:8-10`
**Issue:**
- **`hook.lock`.** `acquireHookLock` writes `<cwd>/.aislop/hook.lock` on every PostToolUse and
  FileChanged invocation (`cli.js:6172-6203`). It is only unlinked if the pid matches. If Claude
  Code kills the hook on timeout, or it crashes, the file stays behind. `git check-ignore`
  confirms `.aislop/hook.lock` is **not** ignored, so it appears in `git status` and is picked up
  by `git add -A`.
- **Temp files.** `atomicWrite` leaves `.aislop/.aislop-tmp-<pid>-<rand>` behind on a crash
  between write and rename (`cli.js:19268-19275`).
- **Subdirectory `.aislop/`.** The hook uses `input.cwd` from stdin as its root
  (`cli.js:19463,19511`). Each of the three new patterns has a slash in the middle, so git
  anchors them to the repo root. A session whose cwd is a subdirectory writes
  `<subdir>/.aislop/{hook.lock,session.jsonl}`, which is not ignored.
- **Local gate noise.** `aislop ci --changes` adds untracked, non-ignored files to its changed set
  (`git ls-files --others --exclude-standard`, `cli.js:23378-23391`), so these leftovers also end
  up in local gate runs.

**Fix:** Ignore everything aislop writes and allow-list the committed config:
```gitignore
**/.aislop/*
!/.aislop/config.yml
!/.aislop/rules.yml
```

## Info

### IN-01: Workflow hardening gaps: actions pinned to tags, install scripts run on PR code, no job timeout

**File:** `.github/workflows/lint.yml:21,27,30,36`
**Issue:**
- **Tag pins.** `actions/checkout@v4`, `pnpm/action-setup@v4` and `actions/setup-node@v4` use
  mutable tags. This mirrors the existing workflows as D-13 requires, so it is Info only. Impact
  is limited by `contents: read`, the absence of secrets and `persist-credentials: false`.
- **Install scripts.** `pnpm install` runs the allowed build scripts (`better-sqlite3`, `sharp`,
  via `pnpm-workspace.yaml` `allowBuilds`) on untrusted fork-PR checkouts. The lint job doesn't
  need native builds; aislop's oxlint and biome ship as optional platform packages.
- **No timeout.** There is no `timeout-minutes`, so a hung step runs to the 6-hour default.

**Fix:** Pin actions to commit SHAs with a `# v4.x.y` comment (ideally across all workflows) and
use:
```yaml
    timeout-minutes: 15
    ...
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile --ignore-scripts
```

### IN-02: Same-repo PR branches run the gate twice

**File:** `.github/workflows/lint.yml:3-7,12-14`
**Issue:** A branch with an open PR triggers both `push` (`refs/heads/x`) and `pull_request`
(`refs/pull/N/merge`). The concurrency groups differ, so neither run cancels the other and two
identical jobs run. This is harmless but wastes minutes and duplicates the check.
**Fix:** Accept it, or skip the `push` run when a PR exists. Alternatively, rely on the WR-03
trigger change.

### IN-03: A bare directive silently suppresses every rule; D-12 is enforced only in review

**File:** `AGENTS.md:171`, `src/sw/client/error-logger.ts:1`
**Issue:**
- **Bare directives.** `parseDirective` (`cli.js:11852-11862`) treats a directive with no rule
  tokens as `all: true`. For example, `// aislop-ignore-file -- noisy` turns off *every* rule for
  the whole file.
- **Reason text.** A reason written without `--` (e.g. `ai-slop/console-leftover because logging`)
  is tokenised into bogus rule names without any error.

D-12 relies on review, which is a locked decision; Info only. The committed `error-logger.ts:1`
directive is correct.
**Fix:** Optionally add a cheap check to `lint.yml`, e.g.
`! git grep -nE 'aislop-ignore-(file|line|next-line)\s*(--|$)' -- src` to reject rule-less
directives.

### IN-04: A broken config silently falls back to defaults

**File:** `.aislop/config.yml` (whole file)
**Issue:** `parseConfig` catches Zod validation errors and returns `defaults` without a warning
(`cli.js:3477-3486`). A future typo, e.g. `rules: { x: warn }` or `ci.format: text`, would
silently discard `failBelow: 95`, the vendored excludes, the `no-autofocus` override and the
telemetry setting. CI would keep passing on default policy. The current file parses correctly
(verified via `loadConfig`).
**Fix:** Add a one-line guard step, e.g.
`node --input-type=module -e 'import {loadConfig} from "aislop"; if (loadConfig(".").ci.failBelow !== 95) process.exit(1)'`,
or mention the silent fallback next to the config's rule-policy comments.

### IN-05: Changesets release PRs never get a Lint check

**File:** `.github/workflows/lint.yml:3-7`
**Issue:** `changesets/action` in `release.yml` opens and updates `changeset-release/master` with
`GITHUB_TOKEN`. Events created with that token don't trigger `push` or `pull_request` workflows,
so the release PR never gets a Lint status. If the maintainer makes Lint a required check (the
D-03 manual step), release PRs become unmergeable. Even if they did run, they bump
`package.json`, which hits CR-01.
**Fix:** When enabling branch protection, exempt `changeset-release/**`, or give the changesets
action a PAT/App token. Note this beside the D-03 manual step.

### IN-06: aislop brings in a large dependency tree, including a new high advisory

**File:** `package.json:165`
**Issue:**
- **Tree size.** `aislop@0.16.1` adds about 1,800 lockfile lines, including
  `@modelcontextprotocol/sdk`, `ink` with its own `react@19.2.8` (the app uses React 18),
  `expo-doctor` and `knip`.
- **New advisory.** It introduces `fast-uri` (high) via `@modelcontextprotocol/sdk > ajv`, one of
  the advisories that fail CR-01.

Nothing is bundled into the app, so this is Info.
**Fix:** Consider it when upgrading. A pnpm `overrides` entry for `fast-uri` can remove the
advisory.

---

_Reviewed: 2026-09-11T18:48:20Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
