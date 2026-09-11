---
phase: 02
slug: adopt-a-lint-config-and-ci-quality-gate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-11
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — procedural verification via `aislop` CLI output and CI pass/fail state (no vitest/jest/test dirs exist in this repo) |
| **Config file** | `.aislop/config.yml` (the artifact under test, not a test config) |
| **Quick run command** | `pnpm exec aislop scan --json .` (or a scoped `--include <path>` scan); `pnpm lint` once the script lands |
| **Full suite command** | `pnpm lint:ci` (the actual gate — mirrors CI exactly; run from a branch off `master`, not `next`, per RESEARCH Pitfall 8) |
| **Estimated runtime** | Not measured during research — record on the first full scan |

---

## Sampling Rate

- **After every task commit:** Run the quick scan (scoped `--include` where the task touched one file) and confirm the intended rule/exclusion change took effect
- **After every plan wave:** Run `pnpm lint:ci` against a real diff from a branch off `master`
- **Before `/gsd-verify-work`:** `.github/workflows/lint.yml` has run (real PR or `workflow_dispatch`) with the expected pass/fail behavior
- **Max feedback latency:** Not measured during research — record on the first full scan

---

## Per-Task Verification Map

Task IDs are assigned by the planner; rows are keyed by CONTEXT.md decision until plans exist. Phase has no REQUIREMENTS.md IDs — decisions D-01…D-16 are the spec.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | D-05, D-06, D-07, D-08, D-09 | — | N/A | cli-output | `pnpm exec aislop scan --json .` → no `jsx-a11y/no-autofocus` diagnostics; comment rules still reported; `exhaustive-deps` at warning | ❌ W0 (config not yet written) | ⬜ pending |
| TBD | TBD | TBD | D-10 | — | N/A | cli-output | `pnpm exec aislop scan --json .` → no diagnostics with file paths under `src/lib/qrcodegen.ts`, `src/lib/open-graph-scraper/`, `src/lib/bencode/`, `src/lib/fix-image-orientation/` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-11, D-12 | — | N/A | cli-output | `pnpm exec aislop scan --json --include src/sw/client/error-logger.ts .` → 0 `ai-slop/console-leftover`, >0 findings from other rules | ✅ (file exists) | ⬜ pending |
| TBD | TBD | TBD | D-14 | supply-chain (planner assigns T-02-xx) | Exact pin, no `postinstall`, lockfile consistent | cli-output | `grep '"aislop": "0.16.1"' package.json` and `pnpm install --frozen-lockfile` exits 0 | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-15 | — | N/A | source-assertion | `package.json` contains `"lint": "aislop scan ."` and `"lint:ci": "aislop ci --changes --base origin/master"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-16 | hook tampering (planner assigns T-02-xx) | Feedback-only; no `--quality-gate` | cli-output | `aislop hook install --claude --project --dry-run` reviewed, then applied; `.claude/settings.json` has no `quality-gate` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-13 | — | N/A | source-assertion | `.github/workflows/lint.yml` contains `pull_request`, `fetch-depth: 0`, `pnpm lint:ci` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — no test framework needs bootstrapping; verification is procedural CLI-output inspection.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `lint.yml` gates PRs and non-master branch pushes on changed files, reflecting the real exit code | D-01, D-03, D-13 | Needs a real GitHub Actions run; not locally scriptable pre-merge | Open a throwaway PR (or `workflow_dispatch`) and confirm the job runs `pnpm lint:ci` and fails/passes as expected |
| `failBelow` reflects sampled real-commit evidence, accounting for error-severity findings in touched legacy files (RESEARCH Pitfall 1) | D-02 | One-time calibration exercise | Run the `lint:ci` equivalent against several recent commits from a branch off `master`; record commits, scores and exit codes in the plan summary / baseline report |
| Baseline report committed and flagged as not comparable to the 0.14.0 scan | D-04 | Document review | Confirm `.planning/research/aislop-scan-<date>.md` + JSON sibling exist and state the version difference |
| Inline-ignore policy documented | D-12 | Document review | `AGENTS.md` describes rule-named ignores with `-- reason` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency recorded on first full scan
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
