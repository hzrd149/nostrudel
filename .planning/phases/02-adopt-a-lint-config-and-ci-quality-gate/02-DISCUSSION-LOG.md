# Phase 2: Adopt a lint config and CI quality gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-11
**Phase:** 02-adopt-a-lint-config-and-ci-quality-gate
**Areas discussed:** Gate strategy, Rule policy, Exclusions & ignores, CI & local wiring

---

## Gate strategy

### What should make the CI gate fail?

| Option | Description | Selected |
|--------|-------------|----------|
| Changed files only | `aislop ci --changes --base origin/master` — PR fails only if touched files score below threshold; ratchets naturally | ✓ |
| Whole-repo floor, raised over time | Full `aislop ci` with failBelow just under post-config score; raise manually | |
| Both | Changed-files gate at a high threshold + whole-repo floor | |

**User's choice:** Changed files only

### What score should changed files in a PR have to reach?

| Option | Description | Selected |
|--------|-------------|----------|
| Measure first, then pick | Planner runs `aislop ci --changes` against recent real commits and sets failBelow just under typical scores | ✓ |
| aislop default: 70 | Keep default; PRs touching dirty legacy files will often fail | |
| Lenient start: 50 | Low bar, raise after backlog phases | |

**User's choice:** Measure first, then pick

### Should the gate block merges from day one?

| Option | Description | Selected |
|--------|-------------|----------|
| Blocking from day one | Job exits non-zero; branch protection stays a manual GitHub setting | ✓ |
| Advisory first | `continue-on-error: true` for a trial period | |

**User's choice:** Blocking from day one

### Should the whole-repo score still be visible somewhere?

| Option | Description | Selected |
|--------|-------------|----------|
| Record baseline once | Full scan committed to `.planning/research/` after config lands | ✓ |
| Report in CI, never fail | Full scan printed in job summary each run | |
| Nothing extra | Run `pnpm lint` locally when needed | |

**User's choice:** Record baseline once

---

## Rule policy

### What should the config start from?

| Option | Description | Selected |
|--------|-------------|----------|
| Defaults + targeted overrides | Plain `aislop init`, default engines, override only decided rules; typecheck stays in `tsc` | ✓ |
| Start from --strict | All engines + aislop typecheck; duplicates tsc and shifts baseline | |

**User's choice:** Defaults + targeted overrides

### `jsx-a11y/no-autofocus` policy

| Option | Description | Selected |
|--------|-------------|----------|
| Off | Autofocus in modals/forms is deliberate UX; settles 999.7's policy question | ✓ |
| Warning | Flag new uses; existing ones cost score | |
| Keep, suppress inline | 25 annotated sites | |

**User's choice:** Off

### Comment rules (trivial / narrative / meta-comment)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep all on | Matches CONVENTIONS.md; existing hits are 999.8's cleanup | ✓ |
| Trivial off, others on | Drop the noisiest, most subjective rule | |
| All off | Comment style is taste, not gated | |

**User's choice:** Keep all on

### `react-hooks/exhaustive-deps` severity

| Option | Description | Selected |
|--------|-------------|----------|
| Warning | aislop default; deliberate omissions get inline ignore + reason | ✓ |
| Error | Stronger signal; legacy-touching PRs score badly until 999.5 | |
| Off | Rely on review | |

**User's choice:** Warning

### `hardcoded-url` and `todo-stub`

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both at defaults | Low count; 999.10 handles consolidation/triage | ✓ |
| hardcoded-url off, todo-stub on | Service URLs are intrinsic to a Nostr client | |
| Both off | Treat as noise | |

**User's choice:** Keep both at defaults

---

## Exclusions & ignores

### Where should vendored exclusions live?

| Option | Description | Selected |
|--------|-------------|----------|
| config.yml `exclude` | Single file for excludes, rules, failBelow; each entry commented | ✓ |
| `.aislopignore` | Separate gitignore-style file | |
| Exclude all of src/lib/ | Convention-based; could hide first-party code | |

**User's choice:** config.yml `exclude`

### `src/sw/client/error-logger.ts` consoles

| Option | Description | Selected |
|--------|-------------|----------|
| File-level ignore | `aislop-ignore-file ai-slop/console-leftover -- reason`; other rules still apply | ✓ |
| Exclude path in config | File drops out of all rules | |

**User's choice:** File-level ignore

### Also exclude `src/lib/fix-image-orientation/`? (found during scouting)

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude it | Copied + lightly modified third-party code | ✓ |
| Keep it scanned | Modified, so treat as ours | |

**User's choice:** Exclude it

### Inline `aislop-ignore` policy

| Option | Description | Selected |
|--------|-------------|----------|
| Allowed, rule + reason required | Must name rule(s) and `-- reason`; documented in AGENTS.md; review-enforced | ✓ |
| Allowed freely | Least friction; bare ignores hide all rules | |
| Discouraged, config only | Keep suppression centralized | |

**User's choice:** Allowed, rule + reason required

---

## CI & local wiring

### What should trigger the gate?

| Option | Description | Selected |
|--------|-------------|----------|
| New lint.yml: PRs + branch pushes | `pull_request` + `push` to non-master branches, `fetch-depth: 0`; covers ngit-mirrored branches | ✓ |
| New lint.yml: pull_request only | Cleanest diff base; misses ngit/direct pushes | |
| Step in an existing workflow | e.g. nsite.yml; runs only post-merge | |

**User's choice:** New lint.yml: PRs + branch pushes

### How should aislop be installed?

| Option | Description | Selected |
|--------|-------------|----------|
| Pinned devDependency | Exact `aislop@0.16.1` in lockfile; same binary locally and in CI | ✓ |
| npx at a pinned version | No lockfile change; version duplicated | |
| npx @latest | Always current; can shift scores unannounced | |

**User's choice:** Pinned devDependency

### What should package.json scripts do?

| Option | Description | Selected |
|--------|-------------|----------|
| lint + lint:ci | `lint` = full scan; `lint:ci` = exact CI gate; workflow calls `pnpm lint:ci` | ✓ |
| Single lint = the gate | One script; whole-repo view needs `pnpm exec aislop scan` | |
| lint, lint:ci, lint:fix | Adds `aislop fix --safe`; invites drive-by 999.8 sweeps | |

**User's choice:** lint + lint:ci

### Install aislop's Claude Code agent hook?

| Option | Description | Selected |
|--------|-------------|----------|
| Install --project, feedback only | Committed `.claude/settings.json`; reports, doesn't block | ✓ |
| Install with --quality-gate | Blocks edits regressing below a whole-repo baseline | |
| Don't install this phase | Leave optional | |

**User's choice:** Install --project, feedback only

---

## Claude's Discretion

None — every question received a concrete selection.

## Deferred Ideas

- GitHub branch protection / required status check (manual repo setting)
- Whole-repo score reporting in CI job summary
- `--quality-gate` mode for the agent hook
- `pnpm lint:fix` script
- SARIF upload to GitHub code scanning
- Decision on intentional unreachable code in `src/services/sqlite/index.ts` (backlog 999.4)
