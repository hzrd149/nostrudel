---
phase: 4
slug: dead-code-and-import-hygiene-sweep
status: complete
nyquist_compliant: true
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

### ⚠ Documentation defect recorded at phase close (04-11) — PLAN.md jq idiom, not this file

8 of the 11 PLAN.md files in this phase (14 total occurrences) wrote their `<verify>` jq filters
using `select([...] | index(.filePath))`. In jq, piping an array literal into `index(.filePath)`
re-scopes `.` to the array itself before `.filePath` is evaluated, so it errors with
`Cannot index array with string "filePath"` (exit 5) instead of returning a count. Six executors
independently hit this and worked around it with the corrected form,
`select(.filePath as $f | [...] | index($f))`. **This file's own Quick run / Full run commands
above (and every other jq command in this file) do not have this bug** — verified clean this
session. The defect is confined to the per-task `<verify>` blocks inside the PLAN.md files, which
are not edited retroactively per this plan's scope (it measures and records, it does not edit
plan files); flagged here for whoever authors 04-PATTERNS.md-equivalent guidance in a future phase.

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
| D-01 | Every bucket-C finding fixed or ledgered | — | scoped-rescan + ledger review | Full form cross-checked against ledger | N/A — the scan *is* the check | ✅ green |
| D-02 | Counts re-measured, not trusted from ROADMAP | — | scoped-rescan | Quick form recorded at phase start | N/A | ✅ green |
| D-02a | Overlap drop recorded, not treated as error | — | scoped-rescan | `no-unused-vars` 208→~125, `import/no-duplicates` 51→~4 | N/A | ✅ green (04-01: 208→125, 51→4, matches exactly) |
| D-03 | Narrative comments in the 6 files untouched; `src/lib/` clean | — | source assertion + git | `git diff` shows import-only changes; `git status --short src/lib/` empty | N/A | ✅ green (`ai-slop/narrative-comment` still 21) |
| D-04 | Auto-fix is its own commit | — | commit-order review | `git log --oneline` shows a lone auto-fix commit | N/A | ✅ green (`138c3f45e`) |
| D-04a | Non-safe `aislop fix` never run | — | manual review | No "Dead code & comments"/"Lint fixes" step in any transcript | N/A | ✅ green |
| D-05 | 24 catch bindings → bare `catch {` | — | scoped-rescan | Quick form; `ai-slop/swallowed-exception` still 0 | N/A | ✅ green |
| D-06 | 57 params `_`-prefixed or deleted | — | scoped-rescan | Quick form scoped to touched files | N/A | ✅ green |
| D-07 | 24 declarations deleted, nothing orphaned | — | grep + typecheck | `grep -rn "<name>" src/` empty + `pnpm build` passes | N/A | ✅ green |
| D-08 | Every ignore rule-scoped with a why-not-fixed reason | — | manual review | Not mechanically checkable — see Manual-Only | N/A | ✅ green (re-read at 04-11, all 4 pass) |
| D-09 | sqlite guarded region kept + ignored; `dbName` deleted | — | scoped-rescan + source assertion | `grep -n "aislop-ignore"` at the site; `dbName` gone | N/A | ✅ green |
| D-10 | `[Textarea, Input]` removed as redundant; imports survive | — | scoped-rescan + source assertion + typecheck | Both imports still referenced (`textAreaComponent={Input}` L181, `={Textarea}` L205); `pnpm build` passes | N/A | ✅ green (amended post-review — see Amendment below) |
| D-11 | Both `formState.isDirty;` kept + ignored | — | source assertion | Statement present at both sites | N/A | ✅ green |
| D-12 | `cleanup;` → `cleanup()`, comment corrected | — | source assertion + typecheck | `pnpm build` + mining still completes | N/A — see Manual-Only | ⚠️ flaky — typecheck/build pass; interactive mining spot-check unverified (see Manual-Only) |
| D-12a | 2 short-circuits → `if (...)` form | — | scoped-rescan | `no-unused-expressions` absent at both sites | N/A | ✅ green |
| D-13 | 3 redundant trailing `return false;` deleted | — | scoped-rescan | `no-unreachable` 9→6; `swallowed-exception` still 0 | N/A | ✅ green |
| D-14 | Before/after table produced | — | scoped-rescan | Full form diffed against 417 baseline | N/A | ✅ green (see 04-11-SUMMARY.md) |
| D-15 | 19 pre-existing hook-order errors (extended scope, 10 files) untouched | — | source assertion | `git show`/`git diff` at merge-base `77032fc00f8` confirms all 19 predate this phase | N/A | ✅ green (extended scope table above) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Documented Ignores Ledger

The phase gate (D-01) is satisfied only when this table accounts for **every** bucket-C finding
still reported by the full-form command. Filled in at phase close (04-11) with the actual per-site
counts, directive text, and reason, measured against the tree at plan 04-11's execution.

No row beyond these was needed: 04-08 resolved its one candidate exception
(`mine-pow.tsx`'s no-op cleanup stub) by adding an in-body explanatory comment instead of an
ignore, and 04-09 resolved all nine of its long-tail findings by genuine fix. Both plans confirmed
in their own summaries that they contribute zero new ledger rows.

> **Amendment (2026-09-16, post code review — maintainer-approved).** This ledger originally
> carried **four** rows. Code review (`04-REVIEW.md`, WR-02) found D-10's stated reason was
> factually false: `Textarea` and `Input` are referenced as values at `magic-textarea.tsx:181`
> (`textAreaComponent={Input}`) and `:205` (`textAreaComponent={Textarea}`) inside the exported
> `MagicInput` / `MagicTextArea` components, so deleting `[Textarea, Input];` could never have
> orphaned them. The premise originated in this phase's CONTEXT.md D-10 (which in turn inherited a
> pre-existing author NOTE at `magic-textarea.tsx:2`), not in any executor's work. The maintainer
> elected to **delete the statement and its directive** rather than keep a suppression resting on a
> false justification — which is what D-01's own bar prefers (fix over suppress). Verified after the
> change: `pnpm build` exits 0, both imports remain referenced, bucket C remains `0`, and
> `eslint/no-unused-expressions` is absent repo-wide. The ledger is now **three** rows / **9**
> suppressed findings.
>
> The D-09 row's reason was reworded in the same pass (WR-01): the original cited a
> "behavior-change risk" that does not exist, since the block sits after an unconditional `throw`
> and deleting it would be a runtime no-op. The **decision** to keep the block is unchanged and
> ROADMAP-sanctioned; only the justification was corrected to state the real rationale. Re-verified
> after rewording: `eslint/no-unreachable` and `ai-slop/unreachable-code` both still read `0`
> repo-wide, so the directive still parses and suppresses correctly.

| Site | Rule(s) ignored | Findings suppressed | Decision | Directive (as committed) | Reason (verbatim) |
|------|-----------------|---------------------|----------|---------------------------|--------------------|
| `src/services/sqlite/index.ts:1` (file-level, covering lines 9-15) | `eslint/no-unreachable`, `ai-slop/unreachable-code` | 7 (6 `no-unreachable` + 1 `unreachable-code`) | D-09 | `// aislop-ignore-file eslint/no-unreachable ai-slop/unreachable-code -- reason` | "the jeep-sqlite web-init block below the CAP_IS_WEB guard throw is unreachable by design; deleting it would be a runtime no-op, but it is deliberately kept as the in-file record of how web sqlite was wired up, since jeep-sqlite cannot be disabled on web. Scoped to the file because the block spans six lines and aislop has no block-level directive form to narrow it further" |
| `src/components/post-modal/index.tsx:101` (next-line, above `formState.isDirty;`) | `eslint/no-unused-expressions` | 1 | D-11 | `// aislop-ignore-next-line eslint/no-unused-expressions -- reason` | "react-hook-form registers this dirty-state subscription through the property read itself; deleting the statement would silently stop the form re-rendering on dirty-state changes, with no type error to catch it" |
| `src/views/new/note/short-text-form.tsx:97` (next-line, above `formState.isDirty;`) | `eslint/no-unused-expressions` | 1 | D-11 | `// aislop-ignore-next-line eslint/no-unused-expressions -- reason` | "the bare property read is what triggers react-hook-form's getter-based subscription; deleting it stops dirty-state re-renders with no compiler error to flag the loss" |
| **Total suppressed** | — | **9** | — | — | — |

*(A fourth row for `src/components/magic-textarea.tsx` was removed post-review — see Amendment above.)*

**D-08 bar re-read for all three rows (manual check, a rescan cannot perform this):** each reason
states *why the code could not be fixed instead* — an unreachable-by-design block kept as the
in-file record of the web-sqlite wiring, and the silent loss of a react-hook-form subscription with
no compiler signal — rather than merely asserting the code is deliberate. All three pass the bar.
The two `post-modal`/`short-text-form` reasons are worded distinctly per the plan's own instruction
(not copy-pasted), even though they describe the same underlying idiom.

**A fourth row failed this bar on independent review and was removed rather than reworded.** That
is the bar working as intended: 04-11's own re-read passed all four, but it was the phase auditing
itself. An independent reviewer checked the claim against the source and found it false. Worth
recording as a lesson — a justification that *sounds* reasonable is not the same as one that is
true, and only a reader outside the phase reliably catches the difference.

**Load-bearing / rule-scoped proof (not a blanket suppression):**
- `src/services/sqlite/index.ts` still reports its pre-existing `ai-slop/trivial-comment` finding
  (line 7) after the file-level directive — first demonstrated by 04-07, reproduced at 04-11, and
  re-confirmed after the post-review rewording.
- `src/components/post-modal/index.tsx` still reports `react/incompatible-library`,
  `complexity/function-too-long`, and `ai-slop/todo-stub`.
- `src/views/new/note/short-text-form.tsx` still reports `react/incompatible-library` and
  `ai-slop/todo-stub`.

Any row added beyond these three is a **new** deliberate exception and needs the same D-08
justification bar. Any bucket-C finding with no row here is a failure of D-01. None was found:
the quick-run command below reads `0`, and every one of the 9 findings that `0` implicitly
suppresses is accounted for in the table above.

---

## Wave 0 Requirements

**None** — there is no test infrastructure to bootstrap, and D-14 (following Phase 3's D-04)
explicitly rejects adding any. Existing infrastructure (the aislop scan itself) covers the phase's
automated verification.

---

## Manual-Only Verifications

| Behavior | Req | Why Manual | Test Instructions | Status (04-11) |
|----------|-----|------------|-------------------|-----------------|
| Each ignore's reason justifies *why the code could not be fixed*, not merely that it is deliberate | D-08 | A rescan proves the directive silences the rule; it cannot judge whether the prose meets the bar `AGENTS.md` sets | Read each of the 4 ledger rows' `-- reason` text and confirm it explains the why-not-fixed, per Phase 3's D-07 precedent | **Done.** All 4 re-read at 04-11 against D-08's bar; all pass (see Documented Ignores Ledger section above). |
| Auto-fix commit contains import changes only | D-03/D-04 | The count dropping does not prove the diff is clean; comment hunks and vendored files must be eyeballed | `git show --stat` the auto-fix commit, then `git show` it; confirm no comment-only hunks and no `src/lib/` paths | **Done** (performed in 04-01; confirmed there via `git status --short src/lib/` empty after every fixer run and a full `git diff -U0` review). |
| PoW mining still completes after `cleanup;` → `cleanup()` | D-12 | This changes runtime behavior — a no-op statement becomes a real call. Typecheck cannot prove the miner still terminates correctly | In dev, mine a note with a difficulty target; confirm it completes, calls back, and the worker is torn down without error | **Outstanding / unverified.** `pnpm build` passes and the dev server was confirmed reachable (`vite serve`, HTTP 200) at 04-11, but the interactive mining spot-check (login, compose a note, set a difficulty target, observe completion + worker teardown in the browser) was not performed by this closing plan — it requires human-driven UAT, not a scripted check. Recorded as unverified rather than dropped, per Phase 3's precedent. |
| Live hook calls survived D-07's deletions | D-07 | Research flagged 3 sites (`locked`, `muted`, `autoDecryptMessages`) where the dead binding is the return value of a live hook call — deleting the statement would remove the invocation. `tsc` will not flag a removed hook call | `git diff` each of the 3 sites; confirm the hook call remains and only the binding was dropped | **Done** (performed in 04-03; each site's decision documented with its live-caller confirmation in 04-03-SUMMARY.md). |
| `setParams` removal preserves the `useState` tuple | D-07 | `views/feeds/dvm/feed.tsx:78` is half a tuple whose other half is live | `git diff` the site; confirm `params` still reads correctly and the setter slot is elided, not the whole hook | **Done** (performed in 04-03; `Object.entries(params)` confirmed live post-edit). |

**Residual risk, explicitly accepted:** D-14 rejected a formal UAT wave, so the rows above are a
lightweight **review-and-spot-check, not a UAT pass**. They are recorded here so the risk is
visible, not to reintroduce UAT scope. The PoW row is the only one requiring a running dev server
and remains the phase's one genuinely outstanding manual item — surfaced here rather than silently
passed over, per Phase 3's precedent for an unrunnable/unperformed manual check.

---

## Validation Sign-Off

- [x] Every task's `<verify>` asserts on **jq output**, never on the scan's exit code
- [x] `git status --short src/lib/` is empty after every `aislop fix` run (confirmed empty in 04-01's summary after every fixer run this phase)
- [x] Sampling continuity: no 3 consecutive tasks without an automated rescan verify
- [x] Wave 0 covers all MISSING references *(N/A — no Wave 0 work)*
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] Every surviving bucket-C finding has a row in the Documented Ignores Ledger (4 rows, 10 findings suppressed, see above — re-verified 04-11)
- [x] **Corrected wording (04-11, D-15 extended scope):** ~~`pnpm lint:ci` and `pnpm build` both pass at phase gate~~ — `pnpm build` passes (exit 0). `pnpm lint:ci` reports 19 error-severity findings, **all** `react-hooks/rules-of-hooks` in touched files, **all proven pre-existing** via `git show`/`git diff` at the merge-base with `origin/next` (see 04-11-SUMMARY.md's inherited-error table for the file/line/evidence breakdown). The phase gate is therefore stated as: **"`lint:ci` reports only inherited errors, each proven pre-existing"**, not "`lint:ci` exits zero." D-15 as originally written named only `app-handler-modal/index.tsx` (3 of the 19); this sign-off extends that same disposition to all 10 touched files carrying inherited hook-order errors, per the maintainer's explicit ruling recorded in 04-11-PLAN.md's `critical_plan_specifics`. `pnpm exec aislop scan --json . 2>/dev/null | jq '[.diagnostics[]|select(.severity=="error")|select(.rule!="react-hooks/rules-of-hooks")]|length'` reads `0` — the phase introduced no error-severity rule of its own.
- [x] `nyquist_compliant: true` set in frontmatter

**Extended D-15 scope (recorded 04-11):** `react-hooks/rules-of-hooks` findings in the following 10
touched files are inherited, pre-existing, and out of scope for this phase (backlog 999.2), per the
project's no-sweep override in `.claude/CLAUDE.md`:

| File | Inherited errors | Pre-existence evidence |
|---|---|---|
| `src/components/app-handler-modal/index.tsx` | 3 (lines 53, 55, 57) | `git diff` at merge-base `77032fc00f8` touches only imports and 2 catch clauses; `useEventFromDecode`'s switch-case hook calls are untouched |
| `src/components/embed-event/link/index.tsx` | 3 (lines 50, 53, 56) | `git diff` at merge-base touches only one import line (`CardProps` removed); switch-case hook calls untouched, same line positions |
| `src/hooks/use-user-bookmarks-list.ts` | 4 (lines 9, 12, 14, 15) | `git diff` merges 2 import lines into 1 (net -1 line); the four `use*` calls inside the non-`use`-prefixed `userUserBookmarksList` function are identical at merge-base, shifted by exactly 1 line |
| `src/components/layout/presets/app-tabs-layout.tsx` | 2 (lines 39, 148) | `git diff` reorganizes imports only (net +6 lines); both `tabs = tabs \|\| useContext(TabsContext);` sites identical at merge-base, shifted by exactly 6 lines |
| `src/views/settings/accounts/components/password-signer-backup.tsx` | 2 (lines 27, 28) | `git diff` at merge-base changes only one catch clause (`catch (error)` → `catch`) well after this region; `useDisclosure()`/`useForm()` after the early return are untouched |
| `src/components/content/components/gallery.tsx` | 1 (line 16) | `git diff` touches the short-circuit statement and `ImageGallery`'s signature elsewhere; `ref = ref \|\| useRef(...)` at line 16 is untouched |
| `src/components/embed-event/card/embedded-zap-receipt.tsx` | 1 (line 33) | `git diff` at merge-base only reorders one import line (net 0 lines); the `useMemo` after the early return is untouched, same line |
| `src/views/feeds/dvm/index.tsx` | 1 (line 28) | `git diff` touches only import lines (net 0); `useEventIntersectionRef(dvm)` after the early return is byte-identical at merge-base, same line |
| `src/views/lists/components/fallback-list-card.tsx` | 1 (line 132) | `git diff` removes several now-dead imports and a duplicate `isSpecialList` local; the conditional `useReplaceableEvent(cord as string)` call is byte-identical at merge-base (shifted by the import/dead-code deltas) |
| `src/views/messages/group/index.tsx` | 1 (line 151) | `git diff` deletes an unrelated `locked`/`GiftWrapsModel` statement in a different function (`DirectMessageGroupPage`); `DirectMessageGroupView`'s `if (!group) return ...` followed by `useMemo` is byte-identical at merge-base, shifted by exactly 2 lines |
| **Total** | **19** | Merge-base used: `77032fc00f8cd36599ed02b0f0369b10c298814b` (`git merge-base origin/next HEAD`, fetched live at 04-11) |

**Approval:** granted — evidence-based, per the phase-gate wording corrected above. `nyquist_compliant: true`.
