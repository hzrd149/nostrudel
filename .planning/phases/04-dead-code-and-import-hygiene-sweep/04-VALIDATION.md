---
phase: 4
slug: dead-code-and-import-hygiene-sweep
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-09-15
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `04-RESEARCH.md` §Validation Architecture (commands reproduced live against `aislop@0.16.1`).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | **None** — no `*.test.*` / `*.spec.*` files exist and no test runner is a dependency (re-confirmed during Phase 4 research; same state as Phase 3). D-14 follows Phase 3's D-04 in explicitly not introducing one. |
| **Config file** | None — and Wave 0 does **not** install one |
| **Quick run command** | jq-filtered bucket-C rescan, single count — see below |
| **Full suite command** | jq-filtered per-file rescan + `pnpm lint:ci` + `pnpm build` — see below |
| **Estimated runtime** | ~9s whole-repo scan (2,164 files) |

The verification signal for this phase is a **scoped lint rescan, not a test suite** (D-14).
`aislop scan` has no `--rule` or `--severity` flag, so the bucket-C filter is applied with `jq`
(`jq-1.6` already present, no new dependency).

### ⚠ The phase gate is NOT "count reaches zero"

This is the single most important difference from Phase 3. Phase 3's bar was a bare `0`. Phase 4's
is **not**, because D-08 … D-11 deliberately keep a handful of findings alive behind rule-scoped
ignores. The gate is:

> Every remaining bucket-C finding is either fixed, or is a row in the
> [Documented Ignores Ledger](#documented-ignores-ledger) below with a `-- reason` that justifies
> why the code could not be fixed instead.

A plan that drives the count to `0` by deleting load-bearing code has **failed**, not passed.

### Quick run command

```bash
pnpm exec aislop scan --json . 2>/dev/null | jq \
  '[.diagnostics[] | select(.rule as $r |
    ["eslint/no-unused-vars","ai-slop/unused-import","import/no-duplicates",
     "ai-slop/duplicate-import","eslint/no-unused-expressions","eslint/no-unreachable",
     "ai-slop/unreachable-code","ai-slop/empty-function","unicorn/no-useless-spread",
     "typescript/no-unnecessary-parameter-property-assignment","eslint/no-extra-boolean-cast",
     "unicorn/no-new-array","eslint/no-shadow-restricted-names","eslint/no-useless-rename",
     "unicorn/no-useless-length-check"] | index($r))] | length'
```

Reads `417` today.

### Full run command

```bash
pnpm exec aislop scan --json . 2>/dev/null | jq '
  [.diagnostics[] | select(.rule as $r |
    ["eslint/no-unused-vars","ai-slop/unused-import","import/no-duplicates",
     "ai-slop/duplicate-import","eslint/no-unused-expressions","eslint/no-unreachable",
     "ai-slop/unreachable-code","ai-slop/empty-function","unicorn/no-useless-spread",
     "typescript/no-unnecessary-parameter-property-assignment","eslint/no-extra-boolean-cast",
     "unicorn/no-new-array","eslint/no-shadow-restricted-names","eslint/no-useless-rename",
     "unicorn/no-useless-length-check"] | index($r))]
  | group_by(.filePath)
  | map({file: .[0].filePath, total: length, rules: [.[].rule] | unique})
  | sort_by(-.total)
'
```

Then `pnpm lint:ci` (from a feature branch; `git fetch origin next` first, per `AGENTS.md`) and
`pnpm build` (typecheck — the real backstop for D-07's deletions).

### ⚠ Pitfall — never assert on the scan's exit code

`pnpm exec aislop scan --json .` **exits 1 even on success**, because bare `aislop scan` exits
non-zero while any finding exists anywhere in the repo — always true here. Every `<verify>` block
must assert on the **jq output**, not the command's exit status. Always redirect stderr
(`2>/dev/null`).

Do **not** substitute `pnpm lint` (always exits 1) or `pnpm lint:ci` (diff-scoped — wrong tool for
a whole-bucket audit) for the bucket count.

### ⚠ Pitfall — `aislop fix` ignores the config `exclude:` list

Research finding, reproduced live: `aislop fix --safe .` does **not** honor
`.aislop/config.yml`'s `exclude:` list, and modified vendored `src/lib/qrcodegen.ts` (17 comment
lines) — a 7th file that D-03 does not name. After **every** fixer run:

```bash
git status --short src/lib/
```

must be empty. If it is not, revert `src/lib/` wholesale before staging — vendored code is out of
scope by D-10 of Phase 2.

---

## Sampling Rate

- **After every task commit:** quick-form jq count, scoped to the file(s) that task touched, or
  whole-repo with an expected-delta check
- **After every plan wave:** full-form per-file table, diffed against the 417-baseline for Wave 1,
  and against the Wave-1-complete state for Wave 2
- **After every `aislop fix` run:** `git status --short src/lib/` is empty (see pitfall above)
- **Before `/gsd-verify-work`:** full form shows every survivor accounted for in the ignores
  ledger, **and** `pnpm lint:ci` passes, **and** `pnpm build` passes
- **Max feedback latency:** ~10 seconds

`pnpm build` is load-bearing, not ceremony: D-07 deletes 24 declarations including whole
components, and `tsc` is what catches a missed reference.

---

## Per-Task Verification Map

Task IDs are assigned at plan time; this maps the requirement set (D-01 … D-15, the locked
decisions that stand in for a missing `REQUIREMENTS.md`) to its verification mechanism.
"Verification Type" means the mechanism, not a test file — no test files exist.

| Req | Behavior | Threat Ref | Verification Type | Automated Command | File Exists | Status |
|-----|----------|------------|-------------------|-------------------|-------------|--------|
| D-01 | Every bucket-C finding fixed or ledgered | — | scoped-rescan + ledger review | Full form cross-checked against ledger | N/A — the scan *is* the check | ⬜ pending |
| D-02 | Counts re-measured, not trusted from ROADMAP | — | scoped-rescan | Quick form recorded at phase start | N/A | ⬜ pending |
| D-02a | Overlap drop recorded, not treated as error | — | scoped-rescan | `no-unused-vars` 208→~125, `import/no-duplicates` 51→~4 | N/A | ⬜ pending |
| D-03 | Narrative comments in the 6 files untouched; `src/lib/` clean | — | source assertion + git | `git diff` shows import-only changes; `git status --short src/lib/` empty | N/A | ⬜ pending |
| D-04 | Auto-fix is its own commit | — | commit-order review | `git log --oneline` shows a lone auto-fix commit | N/A | ⬜ pending |
| D-04a | Non-safe `aislop fix` never run | — | manual review | No "Dead code & comments"/"Lint fixes" step in any transcript | N/A | ⬜ pending |
| D-05 | 24 catch bindings → bare `catch {` | — | scoped-rescan | Quick form; `ai-slop/swallowed-exception` still 0 | N/A | ⬜ pending |
| D-06 | 57 params `_`-prefixed or deleted | — | scoped-rescan | Quick form scoped to touched files | N/A | ⬜ pending |
| D-07 | 24 declarations deleted, nothing orphaned | — | grep + typecheck | `grep -rn "<name>" src/` empty + `pnpm build` passes | N/A | ⬜ pending |
| D-08 | Every ignore rule-scoped with a why-not-fixed reason | — | manual review | Not mechanically checkable — see Manual-Only | N/A | ⬜ pending |
| D-09 | sqlite guarded region kept + ignored; `dbName` deleted | — | scoped-rescan + source assertion | `grep -n "aislop-ignore"` at the site; `dbName` gone | N/A | ⬜ pending |
| D-10 | `[Textarea, Input]` kept + ignored, imports survive | — | scoped-rescan + source assertion | Both imports still present after auto-fix | N/A | ⬜ pending |
| D-11 | Both `formState.isDirty;` kept + ignored | — | source assertion | Statement present at both sites | N/A | ⬜ pending |
| D-12 | `cleanup;` → `cleanup()`, comment corrected | — | source assertion + typecheck | `pnpm build` + mining still completes | N/A — see Manual-Only | ⬜ pending |
| D-12a | 2 short-circuits → `if (...)` form | — | scoped-rescan | `no-unused-expressions` absent at both sites | N/A | ⬜ pending |
| D-13 | 3 redundant trailing `return false;` deleted | — | scoped-rescan | `no-unreachable` 9→6; `swallowed-exception` still 0 | N/A | ⬜ pending |
| D-14 | Before/after table produced | — | scoped-rescan | Full form diffed against 417 baseline | N/A | ⬜ pending |
| D-15 | 3 pre-existing hook-order errors untouched | — | source assertion | `git show` at merge-base confirms lines 55/57/59 predate this phase | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Documented Ignores Ledger

The phase gate (D-01) is satisfied only when this table accounts for **every** bucket-C finding
still reported by the full-form command. The executor fills in the actual count per site.

| Site | Rule(s) ignored | Decision | Reason must justify |
|------|-----------------|----------|---------------------|
| `src/services/sqlite/index.ts:9-15` | `eslint/no-unreachable`, `ai-slop/unreachable-code` | D-09 | Why the jeep-sqlite web-store setup is kept below the guard `throw` rather than deleted |
| `src/components/magic-textarea.tsx:25` | `eslint/no-unused-expressions` | D-10 | Why the expression cannot be removed — deleting it would orphan both imports to the auto-fixer |
| `src/components/post-modal/index.tsx:102` | `eslint/no-unused-expressions` | D-11 | Why the bare property read is load-bearing (react-hook-form getter subscription) |
| `src/views/new/note/short-text-form.tsx:98` | `eslint/no-unused-expressions` | D-11 | Same as above |

Any row added beyond these four is a **new** deliberate exception and needs the same D-08
justification bar. Any bucket-C finding with no row here is a failure of D-01.

---

## Wave 0 Requirements

**None** — there is no test infrastructure to bootstrap, and D-14 (following Phase 3's D-04)
explicitly rejects adding any. Existing infrastructure (the aislop scan itself) covers the phase's
automated verification.

---

## Manual-Only Verifications

| Behavior | Req | Why Manual | Test Instructions |
|----------|-----|------------|-------------------|
| Each ignore's reason justifies *why the code could not be fixed*, not merely that it is deliberate | D-08 | A rescan proves the directive silences the rule; it cannot judge whether the prose meets the bar `AGENTS.md` sets | Read each of the 4 ledger rows' `-- reason` text and confirm it explains the why-not-fixed, per Phase 3's D-07 precedent |
| Auto-fix commit contains import changes only | D-03/D-04 | The count dropping does not prove the diff is clean; comment hunks and vendored files must be eyeballed | `git show --stat` the auto-fix commit, then `git show` it; confirm no comment-only hunks and no `src/lib/` paths |
| PoW mining still completes after `cleanup;` → `cleanup()` | D-12 | This changes runtime behavior — a no-op statement becomes a real call. Typecheck cannot prove the miner still terminates correctly | In dev, mine a note with a difficulty target; confirm it completes, calls back, and the worker is torn down without error |
| Live hook calls survived D-07's deletions | D-07 | Research flagged 3 sites (`locked`, `muted`, `autoDecryptMessages`) where the dead binding is the return value of a live hook call — deleting the statement would remove the invocation. `tsc` will not flag a removed hook call | `git diff` each of the 3 sites; confirm the hook call remains and only the binding was dropped |
| `setParams` removal preserves the `useState` tuple | D-07 | `views/feeds/dvm/feed.tsx:78` is half a tuple whose other half is live | `git diff` the site; confirm `params` still reads correctly and the setter slot is elided, not the whole hook |

**Residual risk, explicitly accepted:** D-14 rejected a formal UAT wave, so the rows above are a
lightweight **review-and-spot-check, not a UAT pass**. They are recorded here so the risk is
visible, not to reintroduce UAT scope. The PoW row is the only one requiring a running dev server;
if the dev server cannot be started (Phase 3 hit an OOM kill doing exactly this), record it as
unverified rather than silently dropping it.

---

## Validation Sign-Off

- [ ] Every task's `<verify>` asserts on **jq output**, never on the scan's exit code
- [ ] `git status --short src/lib/` is empty after every `aislop fix` run
- [ ] Sampling continuity: no 3 consecutive tasks without an automated rescan verify
- [ ] Wave 0 covers all MISSING references *(N/A — no Wave 0 work)*
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] Every surviving bucket-C finding has a row in the Documented Ignores Ledger
- [ ] `pnpm lint:ci` and `pnpm build` both pass at phase gate
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
