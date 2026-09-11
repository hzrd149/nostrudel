---
phase: 02-adopt-a-lint-config-and-ci-quality-gate
plan: 04
subsystem: infra
tags: [aislop, claude-code, hooks, dx, lint]

# Dependency graph
requires:
  - phase: 02-adopt-a-lint-config-and-ci-quality-gate (plan 01)
    provides: aislop 0.16.1 installed exact-pinned as a devDependency with lint/lint:ci scripts
provides:
  - Project-scope Claude Code PostToolUse + FileChanged aislop hooks, feedback-only, pinned to `pnpm exec aislop`
  - Maintainer-approved commit of aislop's generated agent-instruction files (.claude/AISLOP.md, .claude/CLAUDE.md)
affects: [ci-quality-gate, agent-onboarding, future-lint-config-changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Any committed Claude Code hook command that shells out to a devDependency binary is pinned via `pnpm exec <bin>`, never a bare executable name or a package-runner/latest-tag invocation."

key-files:
  created:
    - .claude/settings.json
    - .claude/AISLOP.md
    - .claude/CLAUDE.md
  modified: []

key-decisions:
  - "Task 1 checkpoint: maintainer selected keep-generated — all three installer-written files are committed, including the new .claude/CLAUDE.md that Claude Code auto-loads as project memory alongside AGENTS.md."
  - "Rewrote both generated hook command prefixes from bare `aislop` to `pnpm exec aislop` (D-14); left every argument after the prefix byte-identical to the generator's output."

patterns-established:
  - "aislop hook commands in .claude/settings.json are pinned via `pnpm exec aislop `; any future re-run of `aislop hook install` must be followed by re-applying this prefix rewrite before committing."

requirements-completed: [D-14, D-16]

coverage:
  - id: D1
    description: "Project-scope aislop Claude Code hook (PostToolUse + FileChanged) registered in .claude/settings.json, feedback-only (no Stop hook, no blocking gate)"
    requirement: "D-16"
    verification:
      - kind: other
        ref: "node -e (inline hook-shape check) run against .claude/settings.json after commit — printed 'hooks OK' and exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every aislop hook command begins with `pnpm exec aislop`, resolving the exact-pinned local 0.16.1 binary instead of a bare/global/downloaded copy"
    requirement: "D-14"
    verification:
      - kind: other
        ref: "smoke test: echo '{}' | sh -c \"$CMD\" for both hook commands — exit 0 for both (neither 126 nor 127)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Maintainer explicitly chose which generated agent-instruction files (.claude/AISLOP.md, .claude/CLAUDE.md) are committed"
    verification: []
    human_judgment: true
    rationale: "The decision was made by the maintainer via the orchestrator's checkpoint prompt in the prior session (keep-generated); this continuation agent recorded and executed that choice rather than re-deciding it."
  - id: D4
    description: "Developer-local .claude/settings.local.json is byte-identical before and after the install"
    verification:
      - kind: other
        ref: "sha256sum .claude/settings.local.json before install (f796f4bb79339ff797a92c0996e6d33b63597bc335d3dfb5a1b1b732fdd0e633) and after commit — identical"
        status: pass
    human_judgment: false

duration: ~15min (continuation session)
completed: 2026-09-11
status: complete
---

# Phase 02 Plan 04: Install project-scope aislop Claude Code hook Summary

**Committed `.claude/settings.json` registering aislop's PostToolUse + FileChanged hooks in feedback mode, both commands pinned to `pnpm exec aislop`, plus the maintainer-approved `.claude/AISLOP.md` and `.claude/CLAUDE.md` from the keep-generated decision.**

## Performance

- **Duration:** ~15 min (this continuation session; Task 1's decision itself was made in a prior session before the checkpoint)
- **Completed:** 2026-09-11T18:19:44Z
- **Tasks:** 2 (Task 1: checkpoint decision, resolved before this session; Task 2: install, executed this session)
- **Files modified:** 3 (`.claude/settings.json`, `.claude/AISLOP.md`, `.claude/CLAUDE.md`)

## Accomplishments

- Installed aislop's project-scope Claude Code hook (`pnpm exec aislop hook install --claude --project`, no extra flags — feedback mode only, no Stop hook, no blocking gate), satisfying D-16.
- Rewrote both generated hook command prefixes (`aislop hook claude` and `aislop hook claude --on-file-changed`) to `pnpm exec aislop hook claude` / `pnpm exec aislop hook claude --on-file-changed`, satisfying D-14 — the committed hook always resolves the exact-pinned 0.16.1 devDependency, never a bare/global/downloaded binary.
- Applied the maintainer's Task 1 decision (`keep-generated`): committed `.claude/AISLOP.md` and `.claude/CLAUDE.md` alongside `.claude/settings.json`.

## Task Commits

1. **Task 1: Decide which generated agent-instruction files to commit with the hook** — no commit (decision-only checkpoint). Resolved in a prior session: maintainer selected `keep-generated`. Dry-run evidence gathered in the prior session (`pnpm exec aislop hook install --claude --project --dry-run` planned exactly three writes: `.claude/settings.json`, `.claude/AISLOP.md`, `.claude/CLAUDE.md`) was re-confirmed identically at the start of this continuation session before running the real install.
2. **Task 2: Install the project-scope aislop hook in feedback mode, pinned to the local binary** — `02127bcb4` (feat)

**Plan metadata:** committed in this response (STATE.md/ROADMAP.md/SUMMARY.md), see final commit hash in orchestrator handoff.

## Files Created/Modified

- `.claude/settings.json` - New. Registers `PostToolUse` (matcher `Edit|Write|MultiEdit`) and `FileChanged` (matcher `.aislop/config.yml|.aislop/rules.yml|package.json`) hooks, both commands pinned to `pnpm exec aislop hook claude` / `pnpm exec aislop hook claude --on-file-changed`.
- `.claude/AISLOP.md` - New (generated by aislop 0.16.1, formatted with `pnpm exec prettier -w`). aislop's agent rules and severity ladder, wrapped in aislop-managed `<!-- aislop:begin/end -->` boundary comments.
- `.claude/CLAUDE.md` - New (generated). Single line: `@AISLOP.md`, which Claude Code auto-loads as project memory alongside root `AGENTS.md`.

## Decisions Made

- **Task 1 (keep-generated):** The maintainer explicitly selected committing all three installer-written files rather than `.claude/settings.json` alone. Rationale from the checkpoint: matches aislop's intended integration and lets agents see aislop's severity rules before the hook reports findings; the tradeoff (a second auto-loaded agent-instructions entry point alongside `AGENTS.md`) was accepted.
- **Hook command pinning:** Only the executable prefix was rewritten (bare `aislop` → `pnpm exec aislop`); every argument after it (`hook claude`, `hook claude --on-file-changed`) was left byte-identical to the generator's output, per the plan's instruction not to change hook event names, matchers, or any other settings key.

## Deviations from Plan

None — plan executed exactly as written for the `keep-generated` branch.

**Dry-run file list (reconfirmed this session, matches the prior session's legwork):**
```
Path    /home/robert/Projects/noStrudel/.claude/settings.json
Change  register PostToolUse + FileChanged hooks
Path    /home/robert/Projects/noStrudel/.claude/AISLOP.md
Change  write AISLOP.md rules
Path    /home/robert/Projects/noStrudel/.claude/CLAUDE.md
Change  append @AISLOP.md reference
```

**Original vs. final hook command strings:**

| Event | Generated (original) | Committed (final) |
|---|---|---|
| PostToolUse | `aislop hook claude` | `pnpm exec aislop hook claude` |
| FileChanged | `aislop hook claude --on-file-changed` | `pnpm exec aislop hook claude --on-file-changed` |

**Smoke-test exit codes:** `PostToolUse` command → exit 0; `FileChanged` command → exit 0 (both produced valid JSON hook output; neither was 126 nor 127).

**`.claude/settings.local.json` sha256:** `f796f4bb79339ff797a92c0996e6d33b63597bc335d3dfb5a1b1b732fdd0e633` before and after the install — unchanged, confirmed again after the commit.

## Issues Encountered

- `pnpm exec prettier --check .claude/AISLOP.md` initially failed formatting; fixed with `pnpm exec prettier -w .claude/AISLOP.md` per the plan's step 7, then re-confirmed `--check` passed on all three files and that the `pnpm exec aislop` pin (in `.claude/settings.json`, untouched by the prettier run) still held.
- Running the two hook smoke-test commands (plan step 6) and the earlier `Edit` calls on `.claude/settings.json` produced runtime scan artifacts `.aislop/baseline.json` and `.aislop/session.jsonl` (untracked, not gitignored). These are incidental output of aislop's own hook execution, not part of this plan's `files_modified`; per the plan's step 8 instruction to not commit scan artifacts like `.aislop/history.jsonl`, they were left uncommitted and untracked. A future plan may want to extend the existing `.gitignore` entry for `.aislop/history.jsonl` to cover these as well — out of scope here per the orchestrator's instruction not to modify `.gitignore` beyond this plan's own state files.

## User Setup Required

None — no external service configuration required. Going forward, every Claude Code session editing files in this repo will receive per-edit aislop feedback via the PostToolUse hook (feedback only; CI remains the sole enforcement point per D-16).

## Next Phase Readiness

- D-14 and D-16 are both satisfied; the aislop hook and CI quality gate (landed in 02-02) now share the same pinned-binary discipline.
- `.aislop/config.yml` (02-03) and the new hook (this plan) are both in place — the remaining phase work is plan 02-05.

---
*Phase: 02-adopt-a-lint-config-and-ci-quality-gate*
*Completed: 2026-09-11*

## Self-Check: PASSED
