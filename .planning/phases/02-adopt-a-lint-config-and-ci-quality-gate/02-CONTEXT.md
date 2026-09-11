# Phase 2: Adopt a lint config and CI quality gate - Context

**Gathered:** 2026-09-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Give noStrudel a lint standard it has actually chosen, and a CI gate that stops that standard
from regressing. Concretely: commit an aislop config (`.aislop/config.yml`) with per-rule policy
and vendored-code exclusions, add `lint` / `lint:ci` scripts, add a GitHub Actions workflow that
gates changed files, install aislop's Claude Code per-edit hook, and record a post-config
whole-repo baseline score so backlog phases 999.2–999.10 have a measurable starting point.

**In scope:**

- `.aislop/config.yml` via `aislop init` (defaults) + targeted rule overrides
- Excluding vendored/ported third-party code from scoring
- Handling `src/sw/client/error-logger.ts` console output
- `pnpm lint` and `pnpm lint:ci` scripts; aislop as a pinned devDependency
- New `.github/workflows/lint.yml` running the changed-files gate
- Calibrating `ci.failBelow` against real commits
- Committing aislop's Claude Code hook (feedback mode)
- One-time baseline scan report in `.planning/research/`
- An AGENTS.md note documenting the lint scripts and inline-ignore convention

**Out of scope:** fixing any existing findings (that is backlog 999.2–999.10 — including running
`aislop fix` across the repo), enabling GitHub branch protection (manual repo setting), and any
rule adoption decisions not listed in D-05–D-08 (they stay at aislop defaults).

</domain>

<decisions>
## Implementation Decisions

### Gate strategy

- **D-01:** The CI gate scores **changed files only**: `aislop ci --changes --base origin/master`.
  No whole-repo score is enforced. Rationale: the repo scores 5/100 today and aislop's default
  `failBelow` is 70, so a full-project gate would fail on every run; gating touched files ratchets
  quality without legacy code blocking unrelated work. Explicitly rejected: a manually-raised
  whole-repo floor, and running both gates.
- **D-02:** `ci.failBelow` is **calibrated from evidence, not picked up front**. After the config
  (D-05–D-12) is in place, run `aislop ci --changes` against a handful of recent real commits and
  set `failBelow` just under what typical changes already score. Record the sampled commits and
  their scores alongside the chosen value (in the plan summary or the baseline report, D-04).
  Note: a PR that touches a legacy file inherits that file's existing findings — calibration must
  reflect that, not only clean new files.
- **D-03:** The gate is **blocking from day one** — the job exits non-zero on failure, no
  `continue-on-error`. Making it a required status check via GitHub branch protection is left as a
  manual repo setting for the maintainer, not done by this phase.
- **D-04:** The whole-repo score is **recorded once**, not reported in CI: after the config lands,
  run a full scan with the pinned version and commit a report (score + per-rule counts) to
  `.planning/research/`, following the format of `aislop-scan-2026-08-02.md` (with raw JSON
  alongside). This is the baseline backlog phases re-measure against. Note the 2026-08-02 scan used
  0.14.0 with bundled defaults; the new baseline uses 0.16.1 with the adopted config, so the numbers
  are not directly comparable — the report should say so.

### Rule policy

- **D-05:** Config starts from **plain `aislop init` defaults** plus targeted overrides in the
  `rules:` map. Not `--strict`: no aislop typecheck (TypeScript is already checked by `tsc` in
  `pnpm build`) and no extra engines beyond the defaults.
- **D-06:** `jsx-a11y/no-autofocus` → **`off`**. Autofocus in modals/forms is deliberate
  noStrudel UX. This settles the policy question raised in backlog 999.7; all other jsx-a11y rules
  stay at defaults.
- **D-07:** Comment rules **stay on at defaults**: `ai-slop/trivial-comment`,
  `ai-slop/narrative-comment`, `ai-slop/meta-comment`. They match CONVENTIONS.md guidance against
  comments that restate code. The ~270 existing hits remain backlog 999.8's mechanical cleanup.
- **D-08:** `react-hooks/exhaustive-deps` **stays `warning`** (aislop default). Deliberate
  omissions use an inline ignore with a reason (D-12). Existing sites remain backlog 999.5.
- **D-09:** `ai-slop/hardcoded-url` and `ai-slop/todo-stub` **stay at defaults**. Consolidation and
  triage remain backlog 999.10. All other rules — including `react-hooks/rules-of-hooks` and
  `ai-slop/swallowed-exception` at error — are left at aislop defaults.

### Exclusions & ignores

- **D-10:** Vendored code is excluded via **`exclude:` in `.aislop/config.yml`** (not
  `.aislopignore`, not a blanket `src/lib/`), each entry with a comment naming the upstream source:
  - `src/lib/qrcodegen.ts` — Project Nayuki QR Code generator (MIT)
  - `src/lib/open-graph-scraper/` — ported open-graph-scraper
  - `src/lib/bencode/` — ported bencode
  - `src/lib/fix-image-orientation/` — copied from github.com/prmichaelsen/fix-image-orientation,
    modified to return Blobs (found during scouting; not in the ROADMAP list — user confirmed
    excluding it)
- **D-11:** `src/sw/client/error-logger.ts` gets a **file-level, rule-scoped ignore**:
  `// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output`.
  All other rules still apply to the file. Explicitly rejected: path-excluding it in config.
- **D-12:** Inline `aislop-ignore-*` directives are **allowed, but must name the rule(s) and give a
  `-- reason`**. Bare (rule-less) directives are not acceptable. This convention is documented in
  `AGENTS.md`; enforcement is by review, not tooling.

### CI & local wiring

- **D-13:** A **new dedicated workflow `.github/workflows/lint.yml`**, triggered on `pull_request`
  and on `push` to all branches except `master`. It must check out with enough history
  (`fetch-depth: 0` or an explicit fetch of `master`) for `--base origin/master` to resolve. Kept
  separate from the deploy/release workflows. Setup should mirror existing workflows
  (`pnpm/action-setup@v4`, `actions/setup-node@v4` with Node 24 and pnpm cache, `pnpm install`).
  Rationale for branch pushes: `origin` is an ngit/nostr remote and contributions may not arrive as
  GitHub PRs.
- **D-14:** aislop is installed as an **exact-pinned devDependency (`aislop@0.16.1`)**, locked in
  `pnpm-lock.yaml`, so local runs and CI use the same binary and a new aislop release cannot silently
  shift scores or invalidate the D-02 calibration. Upgrades are explicit changes. Explicitly
  rejected: `npx aislop@latest` (aislop's own template).
- **D-15:** Scripts in `package.json`:
  - `lint` → `aislop scan .` (full human-readable report for local use)
  - `lint:ci` → `aislop ci --changes --base origin/master` (the exact gate; reproduces a red CI
    check locally)
  - The workflow calls `pnpm lint:ci`. No `lint:fix` script this phase.
- **D-16:** Install **aislop's Claude Code hook at project scope, feedback only**:
  `aislop hook install --claude --project`, committed to `.claude/settings.json` (which does not
  exist yet — only the untracked-in-intent `settings.local.json` does). No `--quality-gate`; CI
  (D-01) remains the single enforcement point.

### Claude's Discretion

None — the user selected a concrete option for every question. No "you decide" answers.

### Amendments (2026-09-11, post code review)

The decisions above stay as originally written. After code review (`02-REVIEW.md`) the maintainer
changed them as follows. Where an amendment and the original text differ, the amendment wins.

- **D-01 / D-15 (gate base):** the gate measures changed files from the merge-base with
  `origin/next`, not from `origin/master`. `lint:ci` is now
  `aislop ci --changes --base "$(git merge-base origin/next HEAD)"`, and the workflow still calls
  `pnpm lint:ci`. Maintainer's rationale: everything is built on `next` until a release. Using the
  merge-base instead of the branch tip means a branch is not scored on commits it never made.
  Source: 02-REVIEW.md WR-02, WR-03.
- **D-13 (push trigger):** `push` now ignores `master`, `next` and `changeset-release/**`. Content
  reaches those branches through gated branches and PRs. `pull_request` and `fetch-depth: 0` are
  unchanged. Source: WR-03.
- **D-02 (threshold):** `ci.failBelow` stays at 95 but is documented as a backstop only. aislop
  0.16.1 scores `--changes` against the whole-project file count, so the effective gate is "no
  error-severity findings in touched files". Source: WR-04.
- **D-05 / D-09 (rules and engine settings):** `security/vulnerable-dependency` is downgraded to
  `warning` and the dependency audit stays on (`security.audit: true`). Pre-existing tree-wide
  advisories are still reported but no longer block unrelated changes. Telemetry is explicitly
  disabled: `telemetry.enabled: false` in the config, plus `AISLOP_NO_TELEMETRY` and `DO_NOT_TRACK`
  in the lint workflow. Source: CR-01, WR-01.
- **D-16 (agent hook):** `.claude/CLAUDE.md` gains a "noStrudel overrides for aislop hook feedback"
  section after `@AISLOP.md`. The generated guidance calls findings blocking, forbids inline
  ignores and names `.yaml` config files that aislop never reads. Source: WR-05.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase source

- `.planning/ROADMAP.md` — Phase 2 entry (scope bullets) and the Backlog section (999.2–999.10),
  which this phase's rule/exclusion decisions feed into

### Prior scan (baseline format + rule/finding evidence)

- `.planning/research/aislop-scan-2026-08-02.md` — per-rule counts, top files, caveats, and the
  report format D-04 should follow
- `.planning/research/aislop-scan-2026-08-02.json` — raw scan output (0.14.0, bundled defaults)

### Project conventions

- `AGENTS.md` — agent development guide; target for the D-12 inline-ignore convention and lint
  script documentation
- `.planning/codebase/CONVENTIONS.md` — "Linting" section (currently states no lint config exists;
  should be updated or noted stale) and "Comments" guidance underpinning D-07
- `.planning/codebase/STACK.md` — build/dev tooling (pnpm 11.2.2, Node 24 in CI, Prettier)

### Existing CI

- `.github/workflows/nsite.yml`, `.github/workflows/pages.yml`, `.github/workflows/release.yml` —
  the pnpm/Node 24 setup pattern `lint.yml` should mirror (D-13)
- `.github/workflows/docker-image.yml` — precedent for running on every branch push

### aislop tool documentation (external — not vendored)

- aislop 0.16.1 README (npm package `aislop@0.16.1`, repo github.com/scanaislop/aislop) — config
  keys (`exclude`, `rules`, `ci.failBelow`, `extends`), inline directives
  (`aislop-ignore-next-line`, `aislop-ignore-line`, `aislop-ignore-file`), `ci --changes --base`,
  `hook install --claude --project`. Also `aislop <command> --help` and `aislop rules`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Existing workflow setup steps (`.github/workflows/nsite.yml` lines for `pnpm/action-setup@v4`,
  `actions/setup-node@v4` with `node-version: 24` and `cache: "pnpm"`, `pnpm install`) — copy for
  `lint.yml`.
- `.planning/research/aislop-scan-2026-08-02.md` — template for the D-04 baseline report.

### Established Patterns

- **No lint tooling at all today:** no `.eslintrc*`, `eslint.config.*`, `biome.json`, oxlint or
  knip config; no `lint` script. Only `.prettierrc` / `.prettierignore` and `pnpm format`. The only
  static gate is `tsc` inside `pnpm build`.
- `package.json` uses `pnpm@11.2.2` (`packageManager`); scripts are short one-liners.
- `.prettierignore` excludes `node_modules`, `dist`, `public/lib`, `stats.html`,
  `pnpm-lock.yaml`, `android`, `ios`. aislop excludes `node_modules`, `.git`, `dist`, `build`,
  `coverage` by default; the 2026-08-02 scan covered only `src/` + `vite.config.ts`, so `android/`
  / `ios/` were not scored (unsupported languages) — confirm this still holds with 0.16.1.
- Releases use Changesets (`.changeset/`). Whether a tooling-only change needs a changeset is a
  planner call — nothing user-facing ships in this phase.

### Integration Points

- `package.json` — `devDependencies` (D-14) and `scripts` (D-15)
- `.aislop/config.yml` — new (D-05–D-10)
- `src/sw/client/error-logger.ts` — add file-level directive at top (D-11)
- `.github/workflows/lint.yml` — new (D-13)
- `.claude/settings.json` — new, created by `aislop hook install --claude --project` (D-16); the
  repo also has `.claude/skills/` and a local `settings.local.json`
- `AGENTS.md` — lint section + inline-ignore convention (D-12)
- `.planning/research/aislop-scan-<date>.md` + `.json` — baseline report (D-04)

### Constraints found while scouting

- aislop `ci.failBelow` default is **70** (`--strict` uses 85); current repo score is 5/100.
- **Remote naming differs between local and CI.** Locally, `origin` is the ngit/nostr remote
  (`nostr://…/relay.ngit.dev/noStrudel`) and GitHub is `gh`; in GitHub Actions, `origin` is GitHub.
  `lint:ci`'s `--base origin/master` therefore resolves to the ngit remote's master locally — works
  if it's fetched and in sync, but the planner should verify and document this.
- `aislop init` is interactive (prompts for failBelow, optional workflow). Planner should either
  drive it non-interactively or hand-write the config to match; do **not** accept aislop's
  generated workflow (it uses `npx aislop@latest ci`, contradicting D-13/D-14).
- `aislop` (non-`--json`, non-CI) scans append to `.aislop/history.jsonl` — a local side effect
  that should be gitignored rather than committed. `aislop agent` state under `.aislop/agent/` is
  git-excluded by aislop itself.
- `src/services/sqlite/index.ts` has 6 intentional `no-unreachable` hits below a deliberate throw —
  left as-is this phase (backlog 999.4 decides), but they will count in the baseline and in any PR
  touching that file.
- No web test framework exists; verification is by running the scripts and observing CI.

</code_context>

<specifics>
## Specific Ideas

- Every `exclude` entry and every inline ignore should carry its reason in the file itself, so the
  config reads as "the standard noStrudel chose" rather than a list of silenced paths.
- The threshold must be grounded in measured scores of real recent commits (D-02) — the user
  preferred evidence over picking 70 or 50 up front.

</specifics>

<deferred>
## Deferred Ideas

- **Enabling GitHub branch protection / required status check** for the lint job — manual repo
  setting, outside the codebase (D-03).
- **Whole-repo score reporting in CI** (job summary on every run) — rejected for now in favor of a
  one-time baseline (D-04); revisit if backlog phases need live tracking.
- **`--quality-gate` mode for the agent hook** — rejected for now (D-16); revisit once the
  whole-repo score is closer to the CI threshold.
- **`pnpm lint:fix` (`aislop fix --safe`)** — not added, to avoid drive-by mechanical sweeps before
  backlog 999.8 (D-15).
- **SARIF upload to GitHub code scanning** — mentioned as an option, not discussed.
- **Decision on the intentional unreachable code in `src/services/sqlite/index.ts`** — belongs to
  backlog 999.4.

</deferred>

---

*Phase: 02-adopt-a-lint-config-and-ci-quality-gate*
*Context gathered: 2026-09-11*
