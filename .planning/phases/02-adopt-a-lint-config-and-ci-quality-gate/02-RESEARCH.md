# Phase 2: Adopt a lint config and CI quality gate - Research

**Researched:** 2026-09-11
**Domain:** CI quality gating with `aislop` (multi-engine lint/AI-slop scanner) on a pnpm/Vite/React TypeScript monorepo
**Confidence:** HIGH — every load-bearing claim below was empirically verified against `aislop@0.16.1` in an isolated `git worktree` copy of this repo (not the working tree), not just read from docs.

## Summary

This phase has zero implementation ambiguity left after `/gsd-discuss-phase` — all 16 decisions
(D-01…D-16) are locked. The research task was therefore to de-risk the *mechanics* of executing
those decisions: how `aislop init`, `aislop ci --changes`, the `rules:`/`exclude:` config schema,
inline ignore directives, and `aislop hook install --claude --project` actually behave on
`aislop@0.16.1`, versus what the CLI `--help` text and README imply. Three empirical findings
materially change how the plan must be written, all confirmed by running the real CLI against a
disposable `git worktree acfd3c7d5` (a full checkout of this repo, discarded after testing —
working tree confirmed clean throughout):

1. **`aislop ci` fails on ANY error-severity finding in a touched file, regardless of score.**
   Reproduced 4× consistently: a diff scoring 99/100 (`failBelow: 70`) still exited 1 because one
   touched file (`src/index.tsx`) carried a single pre-existing `ai-slop/swallowed-exception`
   error. The official README text ("exits 1 when score < threshold") does not describe this
   behavior — the score gate and an implicit "zero errors" gate both apply. **This means D-02's
   calibration must sample commits specifically to discover which legacy files carry
   error-severity findings, not just measure aggregate scores** — `failBelow` alone will rarely be
   the actual blocker; inherited errors will.
2. **Plain (non-`--strict`) `aislop init` is a TUI wizard that cannot be driven by piped stdin** —
   redirecting `/dev/null` or piping `\n` characters causes it to print the first screen and exit
   0 without writing any files. It only works over a real PTY. `aislop init --strict` *does* run
   non-interactively but produces the enterprise preset D-05 explicitly rejects (typecheck on,
   failBelow 85). The plan must either run `aislop init` in a genuine interactive terminal, or
   hand-write `.aislop/config.yml` — the exact plain-default schema was captured below and can be
   reproduced byte-for-byte.
3. **`aislop hook install --claude --project` writes three files, not one:** `.claude/settings.json`
   (the PostToolUse/FileChanged hook registration — matches D-16's expectation), plus two files
   D-16 did not anticipate: `.claude/AISLOP.md` (agent instructions) and a brand-new
   **`.claude/CLAUDE.md`** containing only `@AISLOP.md`. This repo has no root `CLAUDE.md` and uses
   `AGENTS.md` as its canonical agent guide — the plan needs an explicit decision point on whether
   `.claude/CLAUDE.md` is desired, since it introduces a second, overlapping agent-instructions
   entry point next to `AGENTS.md`.

**Primary recommendation:** Hand-write `.aislop/config.yml` from the verified plain-default schema
(Section "Verified Config Schema" below) plus the D-06–D-12 overrides, rather than relying on
`aislop init`'s interactive wizard inside an agent-driven execution flow. Pin `aislop@0.16.1`
exactly via `pnpm add -D aislop@0.16.1 --save-exact` (default pnpm save behavior is caret, not
exact). Build the D-02 calibration step around "does this commit touch any file with a pre-existing
error-severity finding" as the primary signal, with score-vs-failBelow as the secondary signal.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rule policy (what's an error/warning/off) | Config / `.aislop/config.yml` | — | Declarative, versioned, not code |
| Score computation & findings | `aislop` CLI (third-party binary) | — | Not reimplemented; wrapped, not hand-rolled |
| PR quality gate | CI / GitHub Actions (`lint.yml`) | — | Enforcement must run where PRs are evaluated, not just locally |
| Local pre-flight check | Dev tooling / `package.json` scripts | — | `pnpm lint` / `pnpm lint:ci` mirror the CI command for fast local feedback |
| Per-edit agent feedback | Claude Code hook config (`.claude/settings.json`) | Dev tooling | Runs inside the coding-agent process, not CI; feedback-only per D-16 |
| Baseline scoring | One-time script / research artifact | — | Not part of CI; a point-in-time report committed to `.planning/research/` |

## User Constraints

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Gate strategy**
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

**Rule policy**
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

**Exclusions & ignores**
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

**CI & local wiring**
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

### Deferred Ideas (OUT OF SCOPE)

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
</user_constraints>

## Project Constraints (from CLAUDE.md / AGENTS.md)

No `./CLAUDE.md` exists at repo root or in `.claude/` (confirmed absent — `ls` returned "No such
file or directory" for both). The project's agent guide is `AGENTS.md` at repo root, which
mandates:

- kebab-case files/dirs, functional components only, relative imports preferred over `~/` alias
- `useAsyncAction` required instead of raw `try/catch` in components for async actions
- Prettier is the only formatter (`.prettierrc`, `pnpm format`); the "Linting" info in
  `.planning/codebase/CONVENTIONS.md` currently says "ESLint/Biome configuration is not detected" —
  **this line goes stale the moment this phase lands** and D-05's scope explicitly calls out
  updating an AGENTS.md note about lint scripts and the inline-ignore convention.
- No lint tooling exists today; `pnpm build` (`tsc --project tsconfig.json && vite build`) is
  presently the only static gate.

**Planner implication:** the phase must patch `AGENTS.md` (add a "Linting" section documenting
`pnpm lint` / `pnpm lint:ci` and the D-12 inline-ignore convention) and should flag
`.planning/codebase/CONVENTIONS.md`'s stale "Linting" note for a future doc-refresh (out of this
phase's explicit scope, but worth a one-line TODO note in the plan since D-05's own "Scope" bullets
mention it).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `aislop` | `0.16.1` exact-pinned | Multi-engine (oxlint/knip/biome-style + custom "ai-slop" rules) scanner, scorer, and CI gate | User-locked (D-14); already used to produce the 2026-08-02 baseline scan committed in this repo — not a new tool introduction, a formalization of an existing choice |

**Version verification:** `npm view aislop version` → `0.16.1` [VERIFIED: npm registry — `npm view`
executed directly, matches the version already named in every CONTEXT.md decision]. Published
`2026-09-09` (latest version bump) out of a package first published `2026-03-11` with 40 published
versions total and 6,562 weekly downloads [VERIFIED: `npm view aislop time --json`,
`api.npmjs.org/downloads`]. Repository `github.com/scanaislop/aislop`, homepage
`scanaislop.com`, no `postinstall` script [VERIFIED: `npm view aislop repository homepage
scripts.postinstall`].

**Installation:**
```bash
pnpm add -D aislop@0.16.1 --save-exact
```
`--save-exact` is required — this repo has no `.npmrc` with `save-exact=true`, so pnpm's default
behavior writes a caret range (`^0.16.1`), which violates D-14's exact-pin requirement
[VERIFIED: `cat .npmrc` → not found; `pnpm --version` → 11.2.2].

### Supporting

None — this phase adds exactly one new dependency by design (D-14). No test framework, no
`lint:fix` script (D-15 explicitly declines it).

### Alternatives Considered

Not applicable — the tool choice (`aislop`) is a locked decision inherited from the prior baseline
scan, not an open question this research needed to resolve. No alternative linters/scanners were
evaluated because D-05 forecloses that question ("plain aislop init defaults").

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|--------------|---------|-------------|
| `aislop` | npm | ~6 months (created 2026-03-11, 40 versions published) | 6,562/week | `github.com/scanaislop/aislop` | **SUS** (`gsd-tools package-legitimacy` flags `too-new`) | **Keep, flagged** — see note below |

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** `aislop` — the automated legitimacy checker's
`too-new` heuristic reads `publishedAt` off the *latest version's* publish timestamp
(2026-09-09), not the package's original creation date (2026-03-11, 40 versions ago). This is a
known limitation of a purely-mechanical heuristic against a package that ships frequent releases.
Mitigating evidence gathered directly against the registry and the vendor's own site: consistent
GitHub org (`scanaislop`) matching the published homepage (`scanaislop.com`), no `postinstall`
script, 40 versions over 6 months (active, not abandoned, not a one-shot slopsquat), and — most
importantly — **this exact package already produced the committed baseline scan
(`.planning/research/aislop-scan-2026-08-02.md`) before this phase started**, so it is not a
name discovered via this research session's web search; it is a tool the project has already been
running. Per protocol this is still tagged `[SUS]` and the planner **must insert a
`checkpoint:human-verify` task before the `pnpm add -D aislop@0.16.1 --save-exact` step**, even
though the practical risk is low.

## Verified Config Schema

`.aislop/config.yml` produced by a genuine interactive `aislop init` run (no `--strict`) inside a
disposable worktree, captured verbatim
[VERIFIED: `aislop@0.16.1` CLI, run via a pty-driven session to get past the TUI, output inspected
directly — not from docs]:

```yaml
version: 1
engines:
  format: true
  lint: true
  code-quality: true
  ai-slop: true
  architecture: false
  security: true
quality:
  maxFunctionLoc: 80
  maxFileLoc: 400
  maxNesting: 5
  maxParams: 6
lint:
  typecheck: false
  expoDoctor: false
security:
  audit: true
  auditTimeout: 25000
scoring:
  weights:
    format: 0.3
    lint: 0.6
    code-quality: 0.8
    ai-slop: 1
    architecture: 1
    security: 1.5
  thresholds:
    good: 75
    ok: 50
  smoothing: 5
  maxPerRule: 40
ci:
  failBelow: 70
  format: json
telemetry:
  enabled: true
```

This is exactly D-05's target ("plain init defaults", `lint.typecheck: false`, `ci.failBelow: 70`,
no `architecture` engine since no `rules.yml` gets written when that engine is declined). Because
architecture stays off, `.aislop/rules.yml` is **not** generated and is **not** needed for this
phase (it's a BYO-architecture-rules file, unrelated to D-06–D-09's rule severities).

D-06–D-10 overrides go under two new top-level keys not present in the bare-default output above,
confirmed by live testing (adding them to config and re-scanning changed the result exactly as
expected — see Common Pitfalls #1 below for the override syntax verification):

```yaml
rules:
  jsx-a11y/no-autofocus: "off"   # D-06 — quote "off"; see Pitfall re: YAML boolean coercion

exclude:
  # D-10 — vendored/ported third-party code, excluded from scoring, not "fixed"
  - src/lib/qrcodegen.ts                    # Project Nayuki QR Code generator (MIT)
  - src/lib/open-graph-scraper/**           # ported open-graph-scraper
  - src/lib/bencode/**                      # ported bencode
  - src/lib/fix-image-orientation/**        # from github.com/prmichaelsen/fix-image-orientation, modified to return Blobs
```

**Rule ID format confirmed:** IDs are the same flat namespace already used in the
2026-08-02 baseline report (`jsx-a11y/no-autofocus`, `react-hooks/exhaustive-deps`,
`ai-slop/trivial-comment`, `ai-slop/narrative-comment`, `ai-slop/meta-comment`,
`ai-slop/hardcoded-url`, `ai-slop/todo-stub`) — **not** prefixed with `oxlint/` even though the
underlying lint engine is oxlint (`aislop rules` groups them under a generic `Lint` catalog entry
`oxlint/*` for documentation purposes only; the actual per-finding `rule` field and the `rules:`
config-override key use the bare `jsx-a11y/…` / `react-hooks/…` form)
[VERIFIED: turned `jsx-a11y/no-autofocus` off via config and re-scanned — 0 remaining findings for
that rule; all other jsx-a11y rules unaffected].

D-11's inline ignore, verified working exactly as specified — placed at the top of
`src/sw/client/error-logger.ts`:
```typescript
// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output
```
[VERIFIED: injected this exact line into a disposable worktree copy of the file, re-scanned —
`ai-slop/console-leftover` findings dropped to 0 for that file while an unrelated rule
(`ai-slop/trivial-comment`) still fired normally, proving the ignore is rule-scoped, not
file-blanket].

## Architecture Patterns

### System Architecture Diagram

```
 developer edit                CI (GitHub Actions)              local pre-flight
      │                              │                                │
      ▼                              ▼                                ▼
 Claude Code PostToolUse       pull_request / push          pnpm lint / pnpm lint:ci
 hook: `aislop hook claude`    (not master)  ──┐                      │
      │                              │         │                      ▼
      ▼                              ▼         │              aislop scan . (human)
 feedback → agent context     .github/workflows/lint.yml      aislop ci --changes
 (score/delta/findings JSON)         │                        --base origin/master
 (feedback only — D-16,              ▼                              │
  no gate here)                pnpm lint:ci                          │
                               = aislop ci --changes                 │
                                 --base origin/master                │
                                      │                               │
                                      ▼                               ▼
                               reads .aislop/config.yml ◄─────────────┘
                               (engines, rules:, exclude:, ci.failBelow)
                                      │
                                      ▼
                               diagnostics scoped to touched files
                               (existing-file-context findings included!)
                                      │
                              ┌───────┴────────┐
                              ▼                 ▼
                     any error-severity   score < failBelow
                     finding present?     (secondary gate)
                              │                 │
                              └──────┬──────────┘
                                     ▼
                          exit 1 → PR check fails (D-03, blocking)
```

The critical path a reader should trace: a touched file's diagnostics include BOTH new findings
introduced by the diff AND pre-existing findings already in that file (`changeContext:
"existing-file-context"`) — both feed the same pass/fail decision.

### Recommended Project Structure

```
.aislop/
├── config.yml         # committed — engines, quality thresholds, rules:, exclude:, ci.failBelow
├── history.jsonl       # NOT committed — local scan-history log written by `aislop scan`/`ci`
.github/workflows/
└── lint.yml            # new — pull_request + push (not master), calls `pnpm lint:ci`
.claude/
├── settings.json        # new, committed — PostToolUse/FileChanged hooks (D-16)
├── AISLOP.md             # new, committed — agent instructions the hook references
└── CLAUDE.md             # new — @AISLOP.md import; needs an explicit keep/adjust decision, see Pitfall #3
src/sw/client/error-logger.ts   # gets the D-11 file-level rule-scoped ignore comment
AGENTS.md                        # gets a new "Linting" section (D-05 scope bullet)
.planning/research/
├── aislop-scan-<date>.md        # new — D-04 baseline report, following the 2026-08-02 format
└── aislop-scan-<date>.json      # new — raw JSON alongside it
package.json                     # devDependencies: aislop (exact); scripts: lint, lint:ci
.gitignore                       # add .aislop/history.jsonl
```

### Pattern: Changed-files-only CI gate

**What:** `aislop ci --changes --base <ref>` diffs the working tree against a ref and scores only
the files that differ, while still including each touched file's *whole-file* findings (not just
the changed hunks).
**When to use:** Exactly D-01's scenario — a low-scoring legacy codebase where a full-repo gate
would block all work.
**Verified example (real repo state, no synthetic edits):**
```bash
# Run inside a clean checkout, no changes needed — this is the real diff between
# the current branch and origin/master today.
npx aislop@0.16.1 ci --changes --base origin/master
# → score 99, label "Healthy", 1 error (ai-slop/swallowed-exception in src/index.tsx,
#   changeContext: "existing-file-context"), exit code 1
```
This is not a hypothetical — it's what `lint.yml` would report on this exact repo state today if
merged before any backlog cleanup. It's useful evidence for D-02's calibration conversation: with
zero rule cleanup, most diffs will pass on score but a nontrivial fraction will fail purely because
they touch a handful of already-known error-carrying files.

### Anti-Patterns to Avoid

- **Treating `pnpm lint`'s exit code as meaningful:** `aislop scan .` (both human and `--json`
  output) exits 1 whenever the project has ANY error/warning findings — which is always true today.
  `pnpm lint` is informational only (D-15); only `pnpm lint:ci` is the real gate. Don't chain
  `pnpm lint && …` anywhere or wire it into a pre-commit hook expecting exit 0.
- **Assuming `aislop init`'s CLI can be scripted with piped input:** it can't (see Pitfall #2).
  Don't write a plan task that pipes answers into `aislop init` and expects it to work non-
  interactively — it will silently no-op.
- **Reading `aislop rules`' `Lint` category (`oxlint/*`, `jsx-a11y` isn't even listed there) as the
  authoritative rule-ID list for config overrides.** The `rules:` catalog command groups
  language-linter findings generically; the actual override keys are the specific IDs
  (`jsx-a11y/no-autofocus`, `react-hooks/exhaustive-deps`) visible in scan output and the existing
  baseline report, not the catalog's category placeholders.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Diff-scoped lint gating | Custom `git diff --name-only` + per-file lint wrapper script | `aislop ci --changes --base <ref>` | Already handles base resolution, whole-file context inclusion, and JSON/human output; a hand-rolled version would need to reinvent the `existing-file-context` semantics this research just spent real effort discovering |
| Per-line suppression convention | A bespoke `// lint-ignore-reason:` comment parser/checker | aislop's built-in `aislop-ignore-line` / `-next-line` / `-file` directives (D-12 already mandates rule + reason) | The directive syntax is already implemented and scanned for by the tool; a parallel convention would just create a second, unenforced dialect |
| Score history tracking | A custom script appending scan results to a log file | `aislop trend` / the already-existing `.aislop/history.jsonl` (gitignored) | Built in; no reason to duplicate |

**Key insight:** every capability this phase needs (diff-scoping, per-rule config, inline
suppression, CI exit codes, agent-hook feedback) already exists natively in the pinned tool — the
entire phase is config and wiring, zero net-new logic.

## Common Pitfalls

### Pitfall 1: CI fails on inherited errors even when the score is well above `failBelow`
**What goes wrong:** A PR with a score of 99/100 against `failBelow: 70` still fails CI.
**Why it happens:** `aislop ci` applies (at minimum) two gates: score-vs-`failBelow`, and a
presence check for any `severity: error` diagnostic among the scored files — including
pre-existing findings in files the diff merely *touches* (`changeContext:
"existing-file-context"`), not just newly-introduced findings. This is not documented in the
official README (which describes only the score gate) but was reproduced 4/4 times against this
repo's real `next`-vs-`master` diff.
**How to avoid:** D-02's calibration step must explicitly enumerate which files in the repo
currently carry `error`-severity findings (`react-hooks/rules-of-hooks`,
`ai-slop/swallowed-exception` per the 2026-08-02 baseline) and treat "does a sampled commit touch
one of those files" as a first-class calibration signal, separate from the raw score number.
Expect early friction: routine PRs touching e.g. `src/index.tsx` will fail CI on day one purely
from inherited errors, which is arguably the intended ratchet behavior (D-01's rationale) but
should be called out explicitly in the plan/PR description so it isn't mistaken for a
misconfiguration.
**Warning signs:** A PR fails `lint:ci` with a healthy score and the failure summary references a
file the PR didn't meaningfully touch, or references `changeContext: "existing-file-context"` in
`--format json` output.

### Pitfall 2: `aislop init` (no `--strict`) is unusable from a non-interactive/agent shell
**What goes wrong:** Running `aislop init` (or piping newlines / `/dev/null` into it) prints the
first prompt screen and exits 0 having written zero files.
**Why it happens:** The wizard is a TUI (checkbox/text prompts) that requires a real TTY; it
detects non-interactive stdin and bails cleanly rather than erroring loudly, which makes the
failure easy to miss (exit code 0, "success"-looking output, no error message).
**How to avoid:** Do not plan a task that "runs `aislop init` and captures the output" as an
agent-executed shell command expecting it to work. Either (a) hand-write `.aislop/config.yml` from
the verified schema above plus the D-06–D-10 overrides (recommended — deterministic, reviewable,
and this research already captured the exact byte-for-byte plain-default output), or (b) have a
human run `aislop init` interactively and commit the result. `aislop init --strict` does run
non-interactively but writes the wrong preset (typecheck on, failBelow 85, extra
`.aislop/rules.yml` with a `## Architecture rules (BYO)` scaffold) — D-05 explicitly rejects
`--strict`.
**Warning signs:** `.aislop/config.yml` doesn't exist after a task claims to have run `aislop
init`; `git status` shows nothing changed.

### Pitfall 3: `aislop hook install --claude --project` writes more than D-16 anticipated
**What goes wrong:** D-16 says the hook is "committed to `.claude/settings.json`". The actual
command also creates `.claude/AISLOP.md` (agent-facing rules/severity-ladder doc) and a **new**
`.claude/CLAUDE.md` containing only `@AISLOP.md`.
**Why it happens:** aislop's Claude Code integration assumes a `CLAUDE.md`-centric project (import
syntax `@file.md`); this repo instead centers its agent guide on root `AGENTS.md` and has no
`CLAUDE.md` anywhere today.
**How to avoid:** Treat this as a decision the plan must surface, not silently accept: either (a)
commit `.claude/CLAUDE.md` as a small, standalone file whose only content is the aislop import
(harmless, additive, doesn't touch `AGENTS.md`), or (b) fold the same guidance manually into
`AGENTS.md` instead and skip generating `.claude/CLAUDE.md`. Given D-16 only locked "install the
hook, feedback only, project scope" and did not discuss `.claude/CLAUDE.md` specifically, the
lower-risk default is (a) — accept the generated files as-is, since they're additive and don't
conflict with `AGENTS.md`. The plan should confirm the exact file list with `--dry-run` before
applying (`aislop hook install --claude --project --dry-run` prints the full planned file list
without writing).
**Warning signs:** Reviewers seeing an unreviewed new `CLAUDE.md` in a PR and assuming it
duplicates or supersedes `AGENTS.md`.

### Pitfall 4: `.aislop/history.jsonl` is not auto-gitignored
**What goes wrong:** Every local `aislop scan` / `aislop scan --json` run appends a line to
`.aislop/history.jsonl` inside the committed `.aislop/` directory. aislop does not write a
`.gitignore` for its own state directory.
**How to avoid:** Add `.aislop/history.jsonl` (or `.aislop/*.jsonl`) to the repo's root
`.gitignore` as part of this phase, alongside committing `.aislop/config.yml`.
**Warning signs:** `git status` shows an untracked/modified `.aislop/history.jsonl` after any local
lint run.

### Pitfall 5: pnpm's default save behavior doesn't produce an exact pin
**What goes wrong:** `pnpm add -D aislop@0.16.1` alone writes `"aislop": "^0.16.1"` to
`package.json` (caret range), because this repo has no `.npmrc` setting `save-exact=true`.
**How to avoid:** Use `pnpm add -D aislop@0.16.1 --save-exact` (or hand-edit `package.json` to the
bare `"0.16.1"` string and run `pnpm install` to sync the lockfile) to satisfy D-14's exact-pin
requirement.
**Warning signs:** `package.json` shows a `^` or `~` prefix on the aislop entry after install.

### Pitfall 6: YAML boolean coercion on bare `off`/`on`/`yes`/`no` in `rules:` overrides
**What goes wrong:** YAML 1.1 parsers (js-yaml, which aislop almost certainly uses given its
Node.js CLI) coerce bare unquoted `off`, `on`, `yes`, `no` into booleans. The README's own example
shows `ai-slop/narrative-comment: warning   # error | warning | off` with an implied bare `off`.
**How to avoid:** Quote the value — `jsx-a11y/no-autofocus: "off"` — which was the form verified
to work in this research. This avoids depending on aislop's config loader correctly re-normalizing
a YAML boolean `false` back into its own `"off"` enum (untested whether it does).
**Warning signs:** A `rules:` override silently has no effect when written as a bare unquoted
`off`.

### Pitfall 7: `origin` vs `gh` remote naming differs between local dev and CI
**What goes wrong:** Locally, `origin` is the ngit/nostr remote
(`nostr://…/relay.ngit.dev/noStrudel`) and `gh` is the GitHub remote; in GitHub Actions, the
checked-out repo's `origin` is GitHub. `--base origin/master` therefore resolves against two
different remotes' `master` branches depending on where it runs.
**How to avoid:** This is a legitimate, already-anticipated risk (CONTEXT.md's own scouting notes
called it out). Confirmed empirically that it is *not* currently a blocking problem: the local
`origin/master` ref exists and is fetchable (`git rev-parse origin/master` succeeds), and real
merged PRs on GitHub target `master` (`gh pr list --state merged` shows `baseRefName: "master"`
for all recent PRs), matching what D-13's workflow assumes. The residual risk is drift: if the
ngit remote's `master` and GitHub's `master` fall out of sync, local `pnpm lint:ci` and CI's
`pnpm lint:ci` will diff against different base commits and can disagree. Document in AGENTS.md
that contributors should `git fetch origin master` before trusting a local `pnpm lint:ci` result.
**Warning signs:** Local `pnpm lint:ci` passes/fails differently than the same branch's CI run.

### Pitfall 8: Testing `lint:ci` locally from the `next` branch produces a misleadingly large diff
**What goes wrong:** This repo currently develops on `next` (40 commits ahead of `master` at time
of research, including all of Phase 1's GSD planning history). Running `pnpm lint:ci` from `next`
diffs against all 40 commits' worth of changes, not a single feature's diff — a much larger and
noisier signal than what a real feature-branch PR (branched from `master`) would produce.
**How to avoid:** When manually testing/calibrating `lint:ci` (D-02), do it from a short-lived
branch created off `master` with a realistic, small diff — not from `next` directly.
**Warning signs:** A local `lint:ci` dry run reports far more changed files than the actual work
being validated.

## Code Examples

### `.github/workflows/lint.yml` skeleton (mirrors existing workflow conventions)

```yaml
# Source: pattern copied from .github/workflows/nsite.yml's setup steps (this repo)
name: Lint

on:
  pull_request:
  push:
    branches-ignore:
      - master

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0   # needed so `--base origin/master` can resolve (D-13)

      - uses: pnpm/action-setup@v4

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"

      - name: Install Dependencies
        run: pnpm install

      - name: Lint (changed files only)
        run: pnpm lint:ci
```

`actions/checkout@v4`'s default `fetch-depth: 1` will NOT have `origin/master` available for
diffing when running from a feature branch — `fetch-depth: 0` (full history) is required, matching
D-13's explicit note.

### `package.json` script additions

```json
{
  "scripts": {
    "lint": "aislop scan .",
    "lint:ci": "aislop ci --changes --base origin/master"
  },
  "devDependencies": {
    "aislop": "0.16.1"
  }
}
```

### `--dry-run` before applying the Claude Code hook

```bash
# Preview the exact file list/diff before writing anything — confirmed output:
#   .claude/settings.json  (register PostToolUse + FileChanged hooks)
#   .claude/AISLOP.md      (write AISLOP.md rules)
#   .claude/CLAUDE.md      (append @AISLOP.md reference)
npx aislop@0.16.1 hook install --claude --project --dry-run
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| No lint config; `.prettierrc` + `tsc` build check only | `.aislop/config.yml` with `aislop` wrapping oxlint/knip/ai-slop-custom engines | This phase | Establishes the first real static-analysis quality gate beyond formatting and type-checking |
| Ad hoc, un-scoped 0.14.0 scan (`aislop-scan-2026-08-02.md`, bundled defaults, score 5/100) | Scoped, project-configured 0.16.1 scan (exclusions applied, `no-autofocus` off) | This phase, D-04 | Score jumps to the 70s–90s range purely from excluding vendored code and one rule — **not directly comparable to the old baseline**, and the D-04 report must say so explicitly (confirmed empirically: a plain-default+exclusions config already scored 78/100 on a full scan vs. the old 5/100) |

**Deprecated/outdated:** The "Linting" section of `.planning/codebase/CONVENTIONS.md` ("ESLint/Biome
configuration is not detected... no lint script") becomes stale the moment this phase merges. Not
this phase's job to fix (out of scope), but the plan should leave a breadcrumb (e.g., a TODO in the
phase's own completion notes) so a later docs-refresh phase catches it.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `aislop`'s "any error-severity finding fails CI" behavior (Pitfall 1) is a stable, intentional design choice and not a version-specific bug that a patch release might change | Common Pitfalls #1 | If aislop changes this in a future patch, D-02's calibration approach (built around this behavior) would need re-verification before any version bump beyond `0.16.1` — mitigated by D-14's exact pin, which prevents silent drift |
| A2 | Accepting all three files from `aislop hook install --claude --project` (including the new `.claude/CLAUDE.md`) is the lower-risk default vs. hand-editing AGENTS.md instead | Common Pitfalls #3 | If the team considers a second agent-instructions entry point (`.claude/CLAUDE.md` alongside `AGENTS.md`) confusing or redundant, this should be flagged back to the user before the plan commits it — this wasn't explicitly among the D-01…D-16 decisions |

## Open Questions (RESOLVED — see 02-04 Task 1)

1. **Does `.claude/CLAUDE.md` (nested inside `.claude/`, not repo root) actually get loaded as
   project memory by Claude Code, or does aislop's hook installer assume a convention this repo
   doesn't use?**
   - What we know: aislop's installer writes it and appends `@AISLOP.md`; the repo has no root
     `CLAUDE.md` today.
   - What's unclear: whether Claude Code's memory-file discovery treats `.claude/CLAUDE.md` as
     equivalent to a root `CLAUDE.md`, or whether it's inert unless something else references it.
   - Recommendation: accept the file as generated (it's harmless either way — either it's read and
     adds mild redundancy with `AGENTS.md`'s content, or it's inert) and don't spend phase time
     investigating Claude Code's internal file-discovery rules; note it in the plan's summary so a
     future audit can revisit if it turns out to matter.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `pnpm install`, `aislop` engines | ✓ | v26.4.0 local / Node 24 pinned in CI (matches existing workflows) | — |
| pnpm | package management | ✓ | 11.2.2 (matches `packageManager` field) | — |
| `gh` CLI | verifying PR base branches during research | ✓ | authenticated, used to confirm `baseRefName: "master"` on recent merged PRs | — |
| `npx` / npm registry access | running `aislop` itself, `npm view` | ✓ | — | — |
| GitHub Actions runner | `lint.yml` execution | ✓ (existing workflows already run there) | ubuntu-latest, matches `nsite.yml`/`docker-image.yml` | — |

No missing dependencies. This phase has no blocking environment gaps.

## Validation Architecture

No automated web test framework exists in this repo (confirmed: no `vitest.config.*`,
`jest.config.*`, `test/`/`tests/`/`__tests__/` directories, or `*.test.*`/`*.spec.*` files found;
the only static gate today is `tsc` inside `pnpm build`). This phase's "tests" are the tool's own
CLI outputs and CI's pass/fail state — there is nothing to unit-test about a YAML config file
beyond running the real scanner against it.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (procedural verification via CLI output, not a test runner) |
| Config file | `.aislop/config.yml` (the artifact under test, not a test config) |
| Quick run command | `pnpm lint` (informational; see Anti-Pattern re: exit code) |
| Full suite command | `pnpm lint:ci` (the actual gate — mirrors CI exactly) |

### Phase Requirement → Verification Map

(No formal REQUIREMENTS.md IDs exist for this phase — ROADMAP lists "Requirements: TBD"; verifying
against the D-01…D-16 decisions directly.)

| Decision | Behavior | Verification | Automated? |
|----------|----------|---------------|------------|
| D-05–D-10 | Config reflects plain defaults + overrides + exclusions | `aislop scan --json .` then grep diagnostics for absence of `jsx-a11y/no-autofocus` and absence of vendored-path file entries | Yes — scriptable, exactly what this research already exercised |
| D-11 | `error-logger.ts` ignore is rule-scoped, not blanket | `aislop scan --json --include src/sw/client/error-logger.ts .`; assert 0 `ai-slop/console-leftover` findings AND >0 findings from other rules | Yes |
| D-01/D-13 | `lint.yml` gates PRs on changed files | Open a throwaway PR (or `act`/manual workflow dispatch) and confirm the job runs `pnpm lint:ci` and reflects the real exit code | Manual — requires a real PR or GH Actions run, not locally scriptable pre-merge |
| D-02 | `failBelow` reflects sampled real-commit evidence | Run `pnpm lint:ci`-equivalent against several recent commits (from a branch off `master`, per Pitfall 8) and record scores in the plan/baseline report | Manual, one-time calibration exercise |
| D-04 | Baseline report committed | Diff `.planning/research/aislop-scan-<date>.md` against the 2026-08-02 format; confirm JSON sibling exists | Manual review |
| D-16 | Hook installed, feedback-only, project scope | `aislop hook install --claude --project --dry-run` then apply; confirm `.claude/settings.json` has no `--quality-gate` Stop hook | Yes — `--dry-run` output is scriptable |

### Sampling Rate

- **Per task commit:** re-run `aislop scan --json .` (or a scoped `--include` scan) after each
  config edit to confirm the intended rule/exclusion change took effect.
- **Per wave merge:** `pnpm lint:ci` against the actual diff being merged (from a real feature
  branch, not `next`).
- **Phase gate:** a real (or simulated via `workflow_dispatch`) run of `.github/workflows/lint.yml`
  showing the expected pass/fail behavior before calling the phase done.

### Wave 0 Gaps

None — no test framework needs bootstrapping; verification is procedural CLI-output inspection as
described above.

## Security Domain

This phase adds a static-analysis tool to CI; it does not touch authentication, session handling,
or user input processing. Most ASVS categories are not applicable.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No — no new user-facing input surface | — |
| V6 Cryptography | No | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Supply-chain risk from a new CI-executed devDependency (`aislop` runs arbitrary code during CI and via the Claude Code hook) | Tampering | Exact-pin (D-14, already locked) + confirmed no `postinstall` script + confirmed publisher/repo match the official project; `security` engine (`npm audit`, enabled by default per the verified config) adds ongoing dependency-vulnerability scanning as a side effect of adopting this tool |
| A committed `.claude/settings.json` hook running `aislop hook claude` on every agent edit | Elevation of privilege (if hook config were tampered with to run arbitrary commands) | D-16 locks feedback-only mode (no `--quality-gate`/Stop-hook auto-execution beyond the scan itself); the hook command itself (`aislop hook claude`) is fixed and reviewable in the committed `settings.json`, not dynamically constructed |

## Sources

### Primary (HIGH confidence — empirically verified this session)

- `aislop@0.16.1` CLI, executed directly against a disposable `git worktree` copy of this repo:
  `--help`, `init --help`, `ci --help`, `scan --help`, `hook --help`, `hook install --help`,
  `rules`, `commands` — full command surface and flag semantics
- `aislop@0.16.1` `init` (genuine interactive run via pty) — captured exact plain-default
  `.aislop/config.yml`
- `aislop@0.16.1` `init --strict` — captured the rejected enterprise preset for comparison
- `aislop@0.16.1` `scan --json` / `ci --format json` — captured real diagnostic objects
  including `changeContext: "existing-file-context"`, confirmed rule-override and exclude-glob
  behavior, confirmed the error-severity-blocks-CI-regardless-of-score behavior (4 reproductions)
- `aislop@0.16.1` `hook install --claude --project` (`--dry-run` and live) — captured the exact
  3-file output
- `npm view aislop version repository homepage description scripts.postinstall time`,
  `api.npmjs.org/downloads/point/last-week/aislop` — package legitimacy signals
- `gsd-tools query package-legitimacy check --ecosystem npm aislop` — SUS verdict (`too-new`
  heuristic false-positive, addressed in Package Legitimacy Audit)
- This repo: `git log`, `git remote -v`, `gh pr list --state merged`, `gh repo view` — confirmed
  real PR base-branch behavior (`master`) and local/CI remote-naming divergence
- `.planning/research/aislop-scan-2026-08-02.md` / `.json` — the prior baseline this phase's D-04
  report must follow the format of and explicitly not compare numbers against

### Secondary (MEDIUM confidence)

- `raw.githubusercontent.com/scanaislop/aislop/main/README.md` (fetched and summarized) — config
  schema (`rules:`, `exclude:`, `extends:`) and inline-directive syntax description; the `exclude:`
  and `rules:` schema portions were independently confirmed by direct CLI testing (now HIGH), but
  the README's own claim about `ci`'s exit-code logic was contradicted by empirical testing (see
  Pitfall 1) — treat README prose as a starting hypothesis, not ground truth, on CLI behavior
  specifics

### Tertiary (LOW confidence)

None — every claim load-bearing enough to affect the plan was either verified directly against the
pinned CLI version or is a verbatim locked decision from CONTEXT.md.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — single locked dependency, version/registry facts verified directly
- Architecture: HIGH — config schema and CI flow captured from live CLI output, not inferred
- Pitfalls: HIGH — every pitfall in this document was reproduced against the real tool, not
  speculated from documentation

**Research date:** 2026-09-11
**Valid until:** Re-verify if `aislop` is upgraded past `0.16.1` (D-14 pins it, so this should only
happen as a deliberate, documented change) — otherwise treat as valid for the life of this pin,
since all findings are tied to this exact CLI version's behavior, not to time-sensitive ecosystem
trends. 30-day sanity check recommended regardless, per standard practice.
