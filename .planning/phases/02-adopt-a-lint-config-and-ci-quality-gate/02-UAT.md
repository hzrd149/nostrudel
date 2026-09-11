---
status: testing
phase: 02-adopt-a-lint-config-and-ci-quality-gate
source: [02-VERIFICATION.md]
started: 2026-09-11T21:15:00Z
updated: 2026-09-11T21:15:00Z
---

## Current Test

number: 1
name: Real GitHub Actions run of lint.yml on a feature-branch push and on a PR into next
expected: |
  Pushing this phase's commits to the GitHub remote (`gh`) on a non-master, non-next branch triggers a
  'Lint' run; opening a pull request into `next` triggers a second 'Lint' run for the pull_request event.
  In both, 'Checkout Repo' makes `origin/next` available via the full-history checkout, the
  'Lint (changed files only)' step runs `pnpm lint:ci` with no base-ref resolution error, and the job
  conclusion matches a locally computed
  `git fetch gh next && pnpm exec aislop ci --changes --base "$(git merge-base gh/next HEAD)"` exit code
  (local dry run on 2026-09-11 with `AISLOP_NO_HISTORY=1` exited 0, 0 errors, 12
  `security/vulnerable-dependency` warnings).
awaiting: user response

## Tests

### 1. Real GitHub Actions run of lint.yml on a feature-branch push and on a PR into next
expected: Both runs trigger, `origin/next` resolves in the Actions checkout, `pnpm lint:ci` runs without a base-ref error, and each job conclusion matches the local `aislop ci --changes --base "$(git merge-base gh/next HEAD)"` exit code.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
