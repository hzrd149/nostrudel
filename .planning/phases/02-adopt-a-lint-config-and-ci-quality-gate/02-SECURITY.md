---
phase: 02
slug: adopt-a-lint-config-and-ci-quality-gate
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-09-11
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → developer machine and CI runner | aislop and its transitive dependencies enter the dependency graph and execute locally, in CI, and from the Claude Code hook | Third-party executable code (supply chain) |
| pull request / branch push → GitHub Actions runner | Contributor-controlled code, including forks, is checked out and scanned by third-party tooling | Untrusted source code; job token |
| runner steps → GITHUB_TOKEN | The job token is available to every step unless scoped | Repository credential (read-only as configured) |
| `.aislop/config.yml` → every scan and CI run | The config decides what the gate can see; an over-broad exclude or ignore removes first-party code from enforcement | Enforcement policy |
| committed `.claude/settings.json` → every contributor's Claude Code session | A committed hook runs a shell command after agent edits | Local command execution |
| aislop installer → agent instruction files | The installer can add files Claude Code auto-loads into agent sessions | Agent instructions |
| local git history → disposable calibration worktrees | Calibration created worktrees and commits in the shared object database | Repository history |
| committed research artifacts → public repository | Raw scan JSON is published with the repo | Scan metadata (no source code) |
| aislop telemetry → PostHog (third party) | Usage reporting from CI, contributor machines and the hook, if enabled | Anonymous install id, environment, counts and scores |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-SC | Tampering | `pnpm add -D aislop@0.16.1` | high | mitigate | Maintainer approved package legitimacy at a blocking checkpoint before install (02-01 Task 1). `package.json` pins exactly `0.16.1`; `pnpm-lock.yaml` records `aislop@0.16.1` with an sha512 integrity hash; `pnpm-workspace.yaml` unchanged this phase with no build-script approval for aislop; aislop ships no preinstall/install/postinstall script | closed |
| T-02-01 | Tampering | aislop version drift | medium | mitigate | Exact pin plus committed lockfile; CI `pnpm install` runs frozen in CI, so a new release cannot silently change scores; upgrades are explicit diffs | closed |
| T-02-02 | Elevation of Privilege | `aislop-tools` bin entry | low | accept | Bin entry, not a lifecycle script — never runs on install and nothing in this phase invokes it (see Accepted Risks Log AR-02-01) | closed |
| T-02-03 | Elevation of Privilege | `lint.yml` job token | medium | mitigate | `permissions: contents: read`, `persist-credentials: false` on checkout, no `secrets.` references, no `pull_request_target` — fork PRs run with a read-only token | closed |
| T-02-04 | Tampering | gate outcome | medium | mitigate | No `continue-on-error`; the step is exactly `run: pnpm lint:ci`, so a failing gate cannot report success (D-03) | closed |
| T-02-05 | Tampering | aislop binary used in CI | medium | mitigate | Workflow invokes only `pnpm lint:ci` (lockfile-pinned binary); no `npx` / `pnpm dlx` / `pnpx` in the workflow | closed |
| T-02-06 | Repudiation | inline ignore directives hiding findings | low | accept | Review-based enforcement by decision (D-12); AGENTS.md and the `.claude/CLAUDE.md` override require rule names and a `-- reason`, so each suppression is attributable in diff review (AR-02-02) | closed |
| T-02-07 | Tampering | exclude list and file-level ignore | medium | mitigate | Exactly four `src/lib/` vendored excludes, each with an upstream-source comment; no `.aislopignore`; the error-logger ignore is scoped to `ai-slop/console-leftover` and a scoped scan shows other rules still fire (0 console-leftover, 3 other) | closed |
| T-02-08 | Information Disclosure | aislop telemetry | low | mitigate (post-review; planned as accept) | Code review WR-01: `telemetry.enabled: false` in `.aislop/config.yml` plus `AISLOP_NO_TELEMETRY=1` and `DO_NOT_TRACK=1` in the `lint.yml` job env (both honored by aislop 0.16.1) — no usage data leaves CI, contributor machines or the hook | closed |
| T-02-09 | Denial of Service | `security.audit` dependency audit inside scans | low | mitigate + accept residual | Code review CR-01: `security/vulnerable-dependency` downgraded to warning, so pre-existing advisories no longer block; audit bounded by `auditTimeout: 25000`. Residual network dependence accepted by the maintainer (AR-02-03) | closed |
| T-02-10 | Elevation of Privilege | `.claude/settings.json` hook command | medium | mitigate | Both aislop hook commands start with `pnpm exec aislop ` (pinned binary, no download path); no Stop hook; no `--quality-gate` (D-16); reinstall-revert risk documented in AGENTS.md (WR-06) | closed |
| T-02-11 | Tampering | agent instruction files written by the installer | medium | mitigate | Maintainer chose `keep-generated` at a blocking decision checkpoint; the install commit `02127bcb4` touched only `.claude/` paths; `.claude/CLAUDE.md` override section corrects AISLOP.md's conflicting guidance (WR-05) | closed |
| T-02-12 | Tampering | developer-local `.claude/settings.local.json` | low | mitigate | sha256 `f796f4bb…e633` identical before and after the install and at audit time | closed |
| T-02-13 | Tampering | calibration worktrees and cherry-picks | low | mitigate | `git worktree list` shows only the main checkout; local branches are exactly `master` and `next`; nothing pushed by the calibration | closed |
| T-02-14 | Information Disclosure | committed raw scan JSON | low | mitigate | Baseline JSON and report contain no local absolute paths (`/home/…`, `/Projects/noStrudel`) | closed |
| T-02-15 | Denial of Service | `ci.failBelow` blocking routine contributions | medium | mitigate | Threshold derived from nine measured commits (D-02); post-review it is documented as a backstop and the effective gate is "no error-severity findings in touched files"; gate measured from the merge-base with `next`, and pushes to `master`/`next` are not gated (WR-02/WR-03), so the integration branch is not permanently red | closed |
| T-02-16 | Denial of Service | dependency-audit findings leaking into the changed-files gate | medium | mitigate | Code review CR-01: advisories downgraded to warning; `pnpm lint:ci` over the phase's own `package.json`/lockfile change exits 0 with 0 errors (12 dependency warnings) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-02 | The `aislop-tools` bin entry never executes on install and is not invoked by any script, workflow or hook in this repo | Plan 02-01 threat model | 2026-09-11 |
| AR-02-02 | T-02-06 | Inline `aislop-ignore-*` directives are enforced by code review, not tooling, per locked decision D-12; rule name and `-- reason` make each suppression attributable | Maintainer (D-12) | 2026-09-11 |
| AR-02-03 | T-02-09 | The dependency audit still calls the registry: an advisory published later can add warnings to a run, and a registry timeout records only an info-level skip. Advisories are warnings and cannot fail the gate, so this affects reporting, not enforcement | Maintainer (code review CR-01 resolution: "Downgrade to warning") | 2026-09-11 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-11 | 17 | 17 | 0 | gsd-secure-phase orchestrator (ASVS L1 grep-level evidence; plan-time register, auditor short-circuited) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-11
