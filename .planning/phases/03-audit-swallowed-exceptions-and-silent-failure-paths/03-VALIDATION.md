---
phase: 3
slug: audit-swallowed-exceptions-and-silent-failure-paths
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-09-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `03-RESEARCH.md` §Validation Architecture (commands tested live against `aislop@0.16.1`).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | **None** — no `*.test.*` / `*.spec.*` files exist and no test runner is a dependency (confirmed in `.planning/codebase/CONCERNS.md` and re-confirmed during research). D-04 explicitly rejects introducing one; that is its own phase. |
| **Config file** | None — and Wave 0 does **not** install one (D-04) |
| **Quick run command** | jq-filtered rescan, single count — see below, asserts `0` |
| **Full suite command** | jq-filtered per-file rescan + `pnpm lint:ci` + `pnpm build` — see below |
| **Estimated runtime** | ~9s whole-repo scan (measured: 8.7s, 2164 files) |

The verification signal for this phase is a **scoped lint rescan, not a test suite** (D-04). `aislop scan`
has no `--rule` or `--severity` flag, so the filter is applied with `jq` (`jq-1.6` already present, no new
dependency).

### Quick run command

```bash
pnpm exec aislop scan --json . 2>/dev/null | jq \
  '[.diagnostics[] | select((.rule=="ai-slop/swallowed-exception" or .rule=="ai-slop/silent-recovery") and .severity=="error")] | length'
```

Reads `31` today. Must read `0` at phase completion.

### Full run command

```bash
pnpm exec aislop scan --json . 2>/dev/null | jq '
  [.diagnostics[] | select(.rule as $r |
    ["ai-slop/swallowed-exception","eslint/no-empty","ai-slop/redundant-try-catch",
     "eslint/no-async-promise-executor","ai-slop/hidden-fallback","ai-slop/silent-recovery"]
    | index($r))]
  | group_by(.filePath)
  | map({file: .[0].filePath, total: length, errors: ([.[] | select(.severity=="error")] | length)})
  | sort_by(-.errors, -.total)
'
```

Then `pnpm lint:ci` (from a feature branch, per `AGENTS.md`) and `pnpm build` (typecheck).

### ⚠ Pitfall — never assert on the scan's exit code

`pnpm exec aislop scan --json .` **exits 1 even on success**, because bare `aislop scan` exits non-zero
while any finding exists anywhere in the repo — always true here. Every `<verify>` block must assert on
the **jq output**, not the command's exit status. Always redirect stderr (`2>/dev/null`).

Do **not** substitute `pnpm lint` (always exits 1) or `pnpm lint:ci` (diff-scoped — wrong tool for a
whole-bucket audit) for the bucket count.

---

## Sampling Rate

- **After every task commit:** quick-form jq count, scoped to the file(s) that task touched (via
  `--include`, or whole-repo and confirm the count dropped by exactly the expected amount)
- **After every plan wave:** full-form per-file table, diffed against the "before" table in
  `03-RESEARCH.md` for Wave 1, and against the Wave-1-complete state for Wave 2
- **Before `/gsd-verify-work`:** quick form reads `0` **and** `pnpm lint:ci` passes **and** `pnpm build`
  passes
- **Max feedback latency:** ~10 seconds

`pnpm build` is load-bearing, not ceremony: several D-09/D-11/D-13 edits delete state or change
signatures, and `tsc` is what catches a missed call site.

---

## Per-Task Verification Map

Task IDs are assigned at plan time; this maps the requirement set (D-01…D-15, the locked decisions that
stand in for a missing `REQUIREMENTS.md`) to its verification mechanism. "Verification Type" means the
mechanism, not a test file — no test files exist.

| Req | Behavior | Threat Ref | Verification Type | Automated Command | File Exists | Status |
|-----|----------|------------|-------------------|-------------------|-------------|--------|
| D-01 | Zero bucket-B error-severity findings after all waves | — | scoped-rescan | Quick form, asserts `0` | N/A — the scan *is* the check | ⬜ pending |
| D-02 | Wave-1 files fixed and committed before Wave-2 | — | commit-order review | `git log --oneline` shows Wave-1 files in earlier commits | N/A | ⬜ pending |
| D-03 | `AGENTS.md` §Error Handling states the convention | — | source assertion | `grep` for the new subsection in `AGENTS.md` | N/A | ⬜ pending |
| D-04 | Per-file before/after table shows 31 → 0 | — | scoped-rescan | Full form, diffed against research "before" table | N/A | ⬜ pending |
| D-05 | Parse-guard sites use comment + explicit return | — | scoped-rescan (the rule is the check) | Quick form scoped via `--include` | N/A | ⬜ pending |
| D-06 | Rewritten catches use bare `catch {` where binding unused | — | scoped-rescan | `no-unused-vars` absent on touched catch lines | N/A | ⬜ pending |
| D-07 | Any ignore is rule-scoped with a why-not-fixed reason | — | manual review | Reason text reviewed against D-08 | N/A | ⬜ pending |
| D-08 | Reason comments name what failed + caller behavior | — | manual review | Not mechanically checkable | N/A | ⬜ pending |
| D-09 | 3 sites on `useAsyncAction`, no markup regression | — | scoped-rescan + typecheck + dev spot-check | Quick form + `pnpm build` + click Remove Mint / Remove Relay / Clear Database | N/A — spot-check is the only way to confirm loading-state rendering | ⬜ pending |
| D-10 | Best-effort fallbacks log the cause, stay silent | — | scoped-rescan + source assertion | Quick form + logger call present at each of the 4 sites | N/A | ⬜ pending |
| D-11 | `decrypt-placeholder.tsx` renders hook `error`, dead catch gone | — | scoped-rescan + dev spot-check | Quick form + trigger a decryption failure, confirm `error` Alert renders | N/A | ⬜ pending |
| D-12 | Logging goes through `logger.extend()` | — | source assertion | No `console.*` added; `helpers/debug.ts` import present | N/A | ⬜ pending |
| D-13 | 4 strays cleared; `native-scanner.ts` behaves identically | — | scoped-rescan + typecheck | Quick + full form, `pnpm build` | N/A — native scanner needs a Capacitor native build to exercise at all | ⬜ pending |
| D-14 | `use-timeline-cache-key.ts` ignore added with correct reason | — | scoped-rescan + manual review | Quick form shows no contribution from line 14 | N/A | ⬜ pending |
| D-15 | `index.tsx:49` logs via namespaced logger including the error | — | scoped-rescan + source assertion | Quick form + caught error passed to the logger call | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**None** — there is no test infrastructure to bootstrap, and D-04 explicitly rejects adding any.
Existing infrastructure (the aislop scan itself) covers the phase's automated verification.

---

## Manual-Only Verifications

| Behavior | Req | Why Manual | Test Instructions |
|----------|-----|------------|-------------------|
| Loading-state rendering unchanged after `useAsyncAction` conversion | D-09 | A rescan proves the finding cleared, not that the UI still renders identically. The hand-rolled `loading` state is replaced by the hook's. | In dev, click Remove Mint (`mint-control`), Remove Relay (`relay-control`), and Clear Database (`enable-with-delete`); confirm spinner/disabled behavior matches pre-change and a failure now toasts |
| Existing `error` Alert still renders | D-11 | The dead catch is deleted; only a real failure exercises the hook's `error` path | In dev, trigger a legacy-DM decryption failure; confirm the component's existing `error` Alert appears |
| `native-scanner.ts` scan still works after hoisting the listener out of the `Promise` constructor | D-13 | Requires a Capacitor **native** build; cannot be exercised in the web dev server at all | Native build + scan a QR code, or accept as residual risk and rely on `pnpm build` typecheck |

**Residual risk, explicitly accepted:** D-04 rejected a manual UAT wave, so the three rows above are a
lightweight **spot-check in dev, not a formal UAT pass**. They are recorded here so the risk is visible,
not to reintroduce UAT scope.

---

## Validation Sign-Off

- [ ] Every task's `<verify>` asserts on **jq output**, never on the scan's exit code
- [ ] Sampling continuity: no 3 consecutive tasks without an automated rescan verify
- [ ] Wave 0 covers all MISSING references *(N/A — no Wave 0 work)*
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] Quick-form count reads `0` at phase gate
- [ ] `pnpm lint:ci` and `pnpm build` both pass at phase gate
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
