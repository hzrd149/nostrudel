---
phase: 02
slug: adopt-a-lint-config-and-ci-quality-gate
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-09-11
audited: 2026-09-11
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — procedural verification via `aislop` CLI output and CI pass/fail state (no vitest/jest/test dirs exist in this repo) |
| **Config file** | `.aislop/config.yml` (the artifact under test, not a test config) |
| **Quick run command** | `AISLOP_NO_HISTORY=1 pnpm exec aislop scan --json .` (or a scoped `--include <path>` scan) |
| **Full suite command** | `pnpm lint:ci` (the actual gate — mirrors CI; measures changed files from `git merge-base origin/next HEAD`) |
| **Estimated runtime** | ~1 min per full scan (observed during the 2026-09-11 audit) |

---

## Sampling Rate

- **After every task commit:** Run the quick scan (scoped `--include` where the task touched one file) and confirm the intended rule/exclusion change took effect
- **After every plan wave:** Run `pnpm lint:ci` from a branch cut from `next`
- **Before `/gsd-verify-work`:** `.github/workflows/lint.yml` has run on GitHub (feature-branch push and a PR into `next`) with the expected result
- **Max feedback latency:** ~1 min (full scan)

---

## Per-Task Verification Map

Requirement IDs are the CONTEXT.md decisions (no REQUIREMENTS.md exists). Where a post-review amendment (02-CONTEXT.md "Amendments (2026-09-11, post code review)") superseded a plan's original `<automated>` check, the amended command is listed and was run green; the original is noted as superseded.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | D-14 | 02-01 threat model (supply chain) | Package legitimacy approved before install | manual checkpoint | n/a — maintainer approved aislop@0.16.1 on 2026-09-11 (precondition `test -z "$(git status --porcelain package.json pnpm-lock.yaml)"` held at the time) | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | D-01, D-14, D-15 | 02-01 threat model (supply chain) | Exact pin, pinned scripts | source-assertion | `node -e` check: `devDependencies.aislop === "0.16.1"`, `scripts.lint === "aislop scan ."`, `scripts["lint:ci"] === 'aislop ci --changes --base "$(git merge-base origin/next HEAD)"'` (original `--base origin/master` check superseded by D-01/D-15 amendment) | ✅ | ✅ green |
| 02-02-01 | 02 | 1 | D-01, D-03, D-13 | 02-02 threat model (CI token/credentials) | Read-only token, no soft-fail | source-assertion | 02-02-PLAN.md Task 1 `<automated>` (prettier check, `run: pnpm lint:ci`, `fetch-depth: 0`, other workflows untouched) + amended trigger check: push `branches-ignore` has `master`, `next`, `changeset-release/**`; `pull_request` present; no `continue-on-error` | ✅ | ✅ green |
| 02-02-02 | 02 | 1 | D-01, D-12, D-15 | — | N/A | source-assertion | `grep -q '^### Linting$' AGENTS.md && grep -qF aislop-ignore-next-line AGENTS.md && grep -qF merge-base AGENTS.md && grep -qF origin/next AGENTS.md && grep -qF .aislop/config.yml .planning/codebase/CONVENTIONS.md && grep -qF 'pnpm lint:ci' .planning/codebase/CONVENTIONS.md` (original `origin/master` / `git fetch origin master` greps superseded by D-01 amendment) | ✅ | ✅ green |
| 02-03-01 | 03 | 2 | D-05, D-06, D-07, D-08, D-09, D-10 | — | N/A | cli-output | 02-03-PLAN.md Task 1 `<automated>` (full `aislop scan --json .`: no `jsx-a11y/no-autofocus`, other jsx-a11y rules still fire, comment rules and `exhaustive-deps` at defaults, no findings under the four vendored paths) | ✅ | ✅ green |
| 02-03-02 | 03 | 2 | D-11, D-12 | — | N/A | cli-output | 02-03-PLAN.md Task 2 `<automated>` (scoped scan of `src/sw/client/error-logger.ts`: `console-leftover 0`, other rules > 0) | ✅ | ✅ green |
| 02-04-01 | 04 | 2 | D-16 | 02-04 threat model (hook command) | Maintainer chose generated-file scope | manual checkpoint | n/a — maintainer selected `keep-generated` on 2026-09-11 (precondition `test -z "$(git status --porcelain .claude)"` held at the time) | ✅ | ✅ green |
| 02-04-02 | 04 | 2 | D-14, D-16 | 02-04 threat model (hook command) | Fixed, pinned, feedback-only hook commands | source-assertion | 02-04-PLAN.md Task 2 `<automated>` (every aislop hook command starts with `pnpm exec aislop `, no `--quality-gate`) + `grep -q '^## noStrudel overrides for aislop hook feedback$' .claude/CLAUDE.md` (D-16 amendment) | ✅ | ✅ green |
| 02-05-01 | 05 | 3 | D-01, D-02 | — | N/A | source-assertion | `grep -B5 '^\s*failBelow: 95$' .aislop/config.yml \| grep -qi backstop` + `## CI gate calibration` heading and all nine sample SHAs in `.planning/research/aislop-scan-2026-09-11.md` + `git worktree list` has one entry (original `# calibrated` inline-comment check superseded by D-02 amendment) | ✅ | ✅ green |
| 02-05-02 | 05 | 3 | D-04 | — | No absolute local paths committed | cli-output | 02-05-PLAN.md Task 2 `<automated>` (baseline JSON is aislop 0.16.1, no absolute checkout path, report matches: score 78, 1196 findings) | ✅ | ✅ green |
| 02-REVIEW-FIX | review fix | post | D-03, D-05, D-09 | 02-REVIEW.md CR-01 / WR-01 | Dependency advisories non-blocking; no third-party telemetry | cli-output | `grep -qE '^\s+audit: true' .aislop/config.yml && grep -qE 'security/vulnerable-dependency: "?warning"?' .aislop/config.yml && grep -qE '^\s+enabled: false' .aislop/config.yml && grep -qF 'AISLOP_NO_TELEMETRY: "1"' .github/workflows/lint.yml && pnpm lint:ci` (exits 0 on the phase's own `package.json`/lockfile change) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — no test framework needs bootstrapping; verification is procedural CLI-output inspection.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `lint.yml` gates feature-branch pushes and PRs into `next` on changed files, reflecting the real exit code | D-01, D-03, D-13 | Needs a real GitHub Actions run; not locally scriptable pre-merge | Push a non-master/non-next branch to `gh` and open a PR into `next`; confirm both Lint runs trigger and match `pnpm exec aislop ci --changes --base "$(git merge-base gh/next HEAD)"`. **Confirmed by the maintainer 2026-09-11 (02-UAT.md).** |
| `failBelow` reflects sampled real-commit evidence | D-02 | One-time calibration exercise | Nine commits sampled in disposable worktrees; evidence in `.planning/research/aislop-scan-2026-09-11.md` § CI gate calibration. Post-review note documents it as a backstop. **Done 2026-09-11.** |
| Baseline report committed and flagged as not comparable to the 0.14.0 scan | D-04 | Document review | `.planning/research/aislop-scan-2026-09-11.md` + `.json` exist and state the version difference. **Reviewed by verifier 2026-09-11.** |
| Inline-ignore policy documented | D-12 | Document review | `AGENTS.md` Linting section describes rule-named ignores with `-- reason`. **Reviewed by verifier 2026-09-11.** |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < ~1 min
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-11

---

## Validation Audit 2026-09-11

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All ten plan tasks' `<automated>` commands were re-run after execution. Seven passed as written; three (02-01-02, 02-02-02, 02-05-01) failed only on values superseded by the post-review amendments and pass with the amended commands above. The review-fix changes (CR-01, WR-01) have their own green check. No test files were generated — the phase has no test framework and its behavior is config and CI, verified through CLI output.
