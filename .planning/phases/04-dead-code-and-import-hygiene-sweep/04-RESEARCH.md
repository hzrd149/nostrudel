# Phase 4: Dead code and import hygiene sweep - Research

**Researched:** 2026-09-15
**Domain:** aislop auto-fix mechanics, TypeScript/ESLint dead-code semantics, git-worktree-verified mechanical remedies
**Confidence:** HIGH — every load-bearing claim below was reproduced empirically in a disposable
detached worktree against this repo's actual `aislop@0.16.1` install and `.aislop/config.yml`,
not inferred from docs or training data.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope & completion**
- **D-01:** Done means every bucket-C finding in `src/` is either fixed or carries a rule-scoped
  `aislop-ignore-*` with a reason (D-08). No bucket-C finding is left un-triaged. Measured by a
  scoped rescan (D-14). Warnings are the whole bucket — "documented or removed" is the completion
  test, not an error count.
- **D-02:** The measured starting point is 417, not the ROADMAP's 445 (Phase 3 cleared ~28). Table:
  `eslint/no-unused-vars` 208 (0 fixable), `ai-slop/unused-import` 85 (85 fixable),
  `import/no-duplicates` 51 (0 fixable), `ai-slop/duplicate-import` 47 (47 fixable),
  `eslint/no-unreachable` 9 (was 6 in the roadmap; 0 fixable), `eslint/no-unused-expressions` 6
  (0 fixable), remaining single-instance rules 11 (0 fixable). Total 417, 132 fixable. Re-measure
  rather than trust either number.
- **D-02a:** The 417 overstates distinct work. 101 of 208 `no-unused-vars` are "imported but never
  used" — the same lines `ai-slop/unused-import` reports (58 at identical `file:line`). Real
  distinct import work is ~112 sites. Duplicate imports are near-identical sets (44 of 47 files
  shared). Expect the 132 auto-fixes to clear substantially more than 132 findings; a
  larger-than-expected drop is not an error.

**Auto-fix boundary**
- **D-03:** `aislop fix --safe .` applies three steps: unused imports (85/57 files), duplicate
  imports (47/44 files), and narrative comments (21/6 files). No `--rule` flag exists. Remedy: run
  the fix, then revert the narrative-comment hunks before staging. Six named contaminated files:
  `webxdc/webxdc.tsx` (8), `services/wallets.ts` (6), `webxdc/game-controls.tsx` (2),
  `signin/connect/index.tsx` (2), `webxdc/components/webxdc-player.tsx` (2),
  `services/pending-unlock.ts` (1). These files may also have legitimate in-scope import fixes —
  verify with `git diff` that what remains is import-only, not a blanket `git checkout --`.
  Rejected: accepting the comment cleanup as a bonus; skipping the 6 files entirely.
- **D-04:** The auto-fix lands in its own commit, separate from every manual change.
- **D-04a:** Do not use `aislop fix` without `--safe`. Non-safe adds "Dead code & comments" (168),
  "Unused declarations" (79), "Lint fixes (js/ts)" (705) — outside bucket C. The 24 dead
  declarations are handled by D-07, by hand.

**Mechanical remedies**
- **D-05:** The 24 unused catch bindings become bare `catch {`. Continues Phase 3's D-06, matches
  `AGENTS.md` § Swallowed Exceptions.
- **D-06:** The 57 unused parameters get `_` prefix where the signature is fixed by an API/callback
  contract (event handlers, `.map((x, i) =>)`, applesauce/React callbacks, interface
  implementations), and are deleted where the parameter merely trails the signature with no caller
  passing it. The lint message itself prescribes the `_` convention.

**Dead declarations**
- **D-07:** All 24 genuinely-dead declarations deleted (git history is the record): `isDirectReply`
  (`services/notifications/threads.ts:86`), `RepairBlobButton`
  (`components/blob-details-modal.tsx:129`), `Header` (`views/pictures/picture/index.tsx:25`),
  `ListFeedButton` (`views/lists/list/follow-set.tsx:42`), `SUGGESTED_MINTS` /
  `DEFAULT_WALLET_RELAYS` (`services/wallets.ts:33-34`), plus 18 dead local variables
  (`highlightText`, `context`, `address`, `isSpecialList`, `url`, `loadingProfiles`, `dbName`,
  `info`, `authors`, `loading`, `locked`, `navigate`, `intent`, `autoDecryptMessages`, `muted`,
  `setParams`, `lookupPromise`, `bestHash`). Confirm with grep that nothing references a component
  by name before deleting; `pnpm build` is the backstop. Rejected: keeping the wallets constants
  behind an ignore (unwired config, not a deliberate exception).

**Deliberate exceptions**
- **D-08:** Load-bearing code that looks dead gets a rule-scoped `aislop-ignore-*` naming the
  rule and ending `-- reason`, per `AGENTS.md` § Inline ignores and Phase 2/3 precedent. The
  reason must justify why the code could not be fixed instead.
- **D-09:** `services/sqlite/index.ts:9-15` (jeep-sqlite dynamic import + web-store init below the
  `CAP_IS_WEB` guard `throw`) kept and ignored — the ROADMAP's named exception. The file carries
  8 bucket-C findings, not 6: 6 `no-unreachable` + 1 `ai-slop/unreachable-code` at line 9, plus a
  genuinely dead `const dbName` at line 43 inside `deleteDatabase` — that one is deleted under
  D-07, not exempted.
- **D-10:** `components/magic-textarea.tsx:25` `[Textarea, Input];` is a deliberate
  import-retention hack, already commented. Kept and ignored (deleting it would make both imports
  unused and D-03's auto-fixer would strip them).
- **D-11:** `components/post-modal/index.tsx:102` and `views/new/note/short-text-form.tsx:98`
  `formState.isDirty;` is react-hook-form's getter-subscription idiom. Kept and ignored.
- **D-12:** `components/pow/mine-pow.tsx:47` `cleanup;` is a genuine bug (bare identifier where a
  call was intended, copy-pasted comment from the line above). Fix to `cleanup()`; verify `cleanup`
  is callable at that point first — if not, deletion may be correct instead, and the summary must
  say which.
- **D-12a:** `components/content/components/gallery.tsx:24` and
  `components/content/links/image.tsx:67` `!e.isPropagationStopped() && show();` — rewrite as
  `if (!e.isPropagationStopped()) show();`. No ignore needed.

**Phase 3 residue**
- **D-13:** `eslint/no-unreachable` rose 6 → 9. Three new sites from Phase 3 commit `b188fe526`
  added a `return false;` inside catches that already had a trailing `return false;` after the
  try/catch: `content/transform/nip-notation.ts:47`, `content/transform/bip-notation.ts:47`,
  `helpers/nostr/goal.ts:109`. Delete the now-redundant trailing `return false;`, keep the in-catch
  return (satisfies error-severity `ai-slop/swallowed-exception`, gates CI — removing it regresses
  Phase 3's bar).

**Verification**
- **D-14:** Verification is a scoped rescan with a per-rule before/after table (417 → N) and an
  explicit list of every site left standing behind an ignore, with its reason. Follows Phase 3's
  D-04 precedent: no new test framework, no manual UAT wave. `pnpm build` must pass after every
  task.
- **D-15:** `pnpm lint:ci` is expected to still report the 3 pre-existing
  `react-hooks/rules-of-hooks` errors in `components/app-handler-modal/index.tsx` (backlog 999.2).
  Not a Phase 4 regression; must not be fixed here.

### Claude's Discretion
- The wave/plan split and per-file ordering of the manual work.
- Which specific parameters are contract-bound vs. freely deletable under D-06.
- Exact wording of each `-- reason` string, subject to D-08's justification bar.
- How to group the 11 single-instance cleanup rules (D-02's last row) into plans.

### Deferred Ideas (OUT OF SCOPE)
- `ai-slop/narrative-comment` / `trivial-comment` / `console-leftover` cleanup — backlog 999.8,
  fenced off by D-03.
- `react-hooks/rules-of-hooks` in `app-handler-modal/index.tsx` — backlog 999.2 (D-15).
- `react-hooks/exhaustive-deps` — backlog 999.5.
- Restructuring the sqlite web guard so the unreachable block disappears without an ignore —
  rejected under D-08/D-09 as behavior-change risk.
- `services/wallets.ts` wiring up `SUGGESTED_MINTS` / `DEFAULT_WALLET_RELAYS` as real config —
  deleted here (D-07); would be a feature, not hygiene.
</user_constraints>

<phase_requirements>
## Phase Requirements

No `REQUIREMENTS.md` exists for this project — the requirement set is the locked decisions D-01
through D-15 in `04-CONTEXT.md` (see `<user_constraints>` above, verbatim). Every ID below is
addressed by findings in this document.

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01 | All bucket-C findings fixed or ignored, none un-triaged | Validation Architecture section: scoped rescan command, per-rule table |
| D-02 / D-02a | Re-measure 417 baseline, expect overlap-driven overshoot | Confirmed live: 417 total now (worktree scan matches CONTEXT.md's table exactly); measured actual post-autofix drop below |
| D-03 | Auto-fix mechanics: 3-step `--safe`, revert narrative-comment hunks | Auto-fix Mechanics section — full empirical diff-by-diff breakdown, including a **7th contaminated file not named in D-03** |
| D-04 / D-04a | Own commit; never run unsafe fix | Auto-fix Mechanics section, idempotency proof |
| D-05 | 24 unused catch bindings → bare `catch {}` | Common Pitfalls: confirmed empirically this introduces zero new findings |
| D-06 | 57 unused params: `_`-prefix vs delete | Common Pitfalls: confirmed empirically `_` prefix silences the rule; concentration data for `markdown.tsx` (10) |
| D-07 | 24 dead declarations, safe-deletion order | Runtime State Inventory-style audit: all 24 grepped, 2 risk classes flagged (hook-side-effect vars, `useState` tuple) |
| D-08 / D-09 / D-10 / D-11 / D-12 / D-12a | Deliberate exceptions | Confirmed `sqlite/index.ts` line ranges and finding split; confirmed `cleanup` is callable (D-12) |
| D-13 | Phase 3 no-unreachable regression, 3 sites | Confirmed exact code shape at all 3 sites |
| D-14 | Scoped rescan, no test framework | Validation Architecture section, mirrors `03-VALIDATION.md` |
| D-15 | Pre-existing hook-order errors not a Phase 4 concern | Noted, out of scope, no action needed |
</phase_requirements>

## Summary

Every claim in D-02 through D-13 was independently reproduced in a disposable detached git
worktree at the current tip (`92f2d8a19`), using the project's real `aislop@0.16.1` binary
against the real `.aislop/config.yml`. The 417 bucket-C baseline is exact. `aislop fix --safe .`
is idempotent (a second run finds 0/0/0) and does **not** reorder or regroup surviving imports —
it merges duplicate module specifiers in place and deletes whole unused-import lines, so
CONVENTIONS.md's external → internal → feature-local grouping survives untouched.

Two things D-03 does not fully capture, found only by running the tool: **`aislop fix --safe`
does not respect `.aislop/config.yml`'s `exclude:` list** — it modified the vendored,
excluded `src/lib/qrcodegen.ts` (17 lines of comments stripped) in this run, meaning the plan must
explicitly check all four vendored/excluded paths after running the fixer and revert any that
were touched. And the "narrative comments" fix step is a *different, wider* category than the
`ai-slop/narrative-comment` rule alone (26 findings / 7 files at fix-plan time vs. 21/6 at scan
time) — the extra file is exactly `qrcodegen.ts`. Of the 6 files D-03 names, 5
(`webxdc.tsx`, `game-controls.tsx`, `connect/index.tsx`, `webxdc-player.tsx`,
`pending-unlock.ts`) are **comment-only diffs with zero import changes** — a plain
`git checkout -- <file>` reverts them cleanly, no hunk surgery needed. Only `wallets.ts` is truly
mixed: the fixer merged two `applesauce-common/helpers` import statements into one
(`import { parseBolt11, parseLNURLOrAddress, type EncryptedContentCache } from "..."`) alongside 6
narrative-comment deletions, so it alone needs selective hunk reversion.

D-02a's overlap claim is confirmed and, empirically, undersold: after the full `--safe` fix,
`eslint/no-unused-vars` dropped from 208 to 125 (83 cleared, not the 58-at-identical-line floor),
`ai-slop/unused-import` and `ai-slop/duplicate-import` both hit 0, and `import/no-duplicates`
dropped from 51 to 4 — not the 3 D-02a implies. The 4th straggler is `views/badges/badge-details.tsx`,
where `@chakra-ui/react` and `nostr-tools` are each imported once in the external-import block and
again lower down mixed with internal imports; the fixer does not merge a duplicate that straddles
the blank-line group boundary. Whole-repo bucket-C count after the full auto-fix (imports +
narrative comments, before reverting comments): 417 → 155.

D-06's `_`-prefix remedy is confirmed to work: a trailing unused parameter fires
`eslint/no-unused-vars` ("...should start with a '_'"), and prefixing it with `_` produces zero
findings. D-05's bare-`catch {}` remedy is confirmed safe: converting `catch (err) {}` (which
fires both `no-unused-vars` and error-severity `ai-slop/swallowed-exception`, per AGENTS.md) to a
bare `catch { /* comment */ }` clears both rules with no new finding, as long as the catch body is
not literally empty (a literally-empty block already triggers `eslint/no-empty` regardless of the
binding, so this is not a new regression introduced by D-05).

All 24 D-07 targets were located by grep and 4 are worth flagging for the planner: `isDirectReply`
is referenced only inside a disabled comment (`// if (replyPointer && isDirectReply(...))`),
confirming it is dead, not orphaned by a rename. `setParams` in `views/feeds/dvm/feed.tsx:78` is
the setter half of `const [params, setParams] = useState(...)` where `params` **is** used — the
fix is `const [params] = useState(...)`, not deleting the whole statement. `locked` in
`views/messages/index.tsx:171` and `views/messages/group/index.tsx:86`, and `muted` in
`views/user/tabs/lists.tsx:23`, are unused return values of applesauce `useEventModel` /
`useUserMutes` calls — per the applesauce pattern documented in AGENTS.md these are reactive
EventStore queries (no network side effect of their own), so deleting the whole call is expected
to be safe, but it is a different risk shape than deleting a plain local variable and is called
out explicitly in Common Pitfalls.

**Primary recommendation:** Sequence the auto-fix commit (D-03/D-04) as its own first wave —
`aislop fix --safe .`, revert the 5 comment-only files wholesale, hand-revert only the
narrative-comment hunks in `wallets.ts`, `git checkout` any touched vendored path, confirm the
post-fix bucket-C count via the jq command below, commit. Every subsequent manual-remedy plan
(D-05 through D-13) runs in wave 2+ against the already-fixed tree, so no two plans ever touch the
same file's same lines in the same wave.

## Architectural Responsibility Map

This phase is a cross-cutting lint/hygiene sweep, not a feature that introduces new architectural
surface. Every capability below is "fix code in place," so the tier map is trivial but stated for
completeness.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Remove unused/duplicate imports | Browser / Client (source files across all tiers) | — | Pure static analysis on `src/**/*.{ts,tsx}`; no runtime tier owns import hygiene specifically |
| Delete dead declarations | Browser / Client | — | Same — dead code lives wherever it was written; no new tier boundary crosses |
| Silence/replace unused catch bindings & params | Browser / Client | — | Mechanical signature edits, no behavior change by design |
| Guarded dead-code exceptions (`sqlite/index.ts`) | Browser / Client (Capacitor native bridge module) | Database / Storage | `services/sqlite/index.ts` is the native-SQLite adapter; the exception exists because web builds must not execute this path — a platform-detection boundary, not a client/server split |
| Rescan/verification | N/A (tooling) | — | `aislop scan` runs as a CLI step, not part of the shipped app |

## Standard Stack

No new dependencies. This phase uses only what Phase 2 already installed and pinned.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| aislop | 0.16.1 (exact-pinned, already installed) | Scan + `--safe` auto-fix for unused/duplicate imports and narrative comments | Adopted project-wide lint standard (Phase 2); `[VERIFIED: package.json]` |

### Supporting
None — no test framework, no new lint plugin, no new CLI tool. `pnpm build` (`tsc` + `vite build`)
and `pnpm lint:ci` are the existing gates (Phase 2), reused unchanged.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `aislop fix --safe .` then selective revert | `aislop fix --safe --include <path>` per directory | Scoping by directory (confirmed working: `aislop fix --safe src/helpers` in Phase 3/CONTEXT precedent) avoids touching the 6 contaminated files at all, but requires running the fixer N times instead of once, and does not change the fact that `wallets.ts` genuinely needs both fixes — not adopted since D-03 already locks the single-run-then-revert approach |
| Manual `_`-prefix / delete decisions per D-06 | `eslint --fix` with a custom `argsIgnorePattern` | Not available — aislop bundles its own engines, no standalone ESLint config exists (AGENTS.md, CONVENTIONS.md); out of scope to introduce one |

**Installation:** None required — `aislop` is already an exact-pinned devDependency.

**Version verification:** `pnpm exec aislop --version` → `0.16.1`, matching `package.json` and
`AGENTS.md`'s documented pin. `[VERIFIED: local npm install, ecosystem: npm]`

## Package Legitimacy Audit

Not applicable — this phase installs no new packages. `aislop` was already vetted and installed
under a maintainer-approved legitimacy checkpoint in Phase 2 (`02-01-PLAN.md`).

## Auto-Fix Mechanics (D-03/D-04) — Empirical Findings

All of the following was reproduced in a disposable `git worktree add --detach` at `92f2d8a19`
(current tip), with `node_modules` symlinked from the main checkout and the `aislop` binary
invoked directly (`./node_modules/.bin/aislop`, bypassing `pnpm exec`'s lockfile-freshness check,
which aborts non-interactively in a fresh worktree). The worktree was destroyed
(`git worktree remove --force`) after the experiment; nothing was left in the main tree.

### Fix-plan step breakdown (`aislop fix --safe --dry-run .`)

```
* Unused imports    - 85 findings in 57 files
* Duplicate imports  - 47 findings in 44 files
* Narrative comments - 26 findings in 7 files   <-- NOT 21/6, see below
* Formatting (js/ts) - 0 findings
- Dead code & comments   - skipped by --safe
- Unused declarations    - skipped by --safe
- Lint fixes (js/ts)     - skipped by --safe
- Unused dependencies    - skipped by --safe
```

The "Narrative comments" fix step's counted findings (26/7) do not match the scan's
`ai-slop/narrative-comment` rule count (21/6) that D-03 quotes. The extra file is
**`src/lib/qrcodegen.ts`** — vendored, MIT-licensed, and explicitly excluded from scoring in
`.aislop/config.yml`. `aislop fix --safe .` does not honor the `exclude:` list; it stripped 4
docstring-style comment blocks (17 lines) from that file in this run.
`[VERIFIED: reproduced in worktree]`

**Action for the plan:** after running `aislop fix --safe .`, run
`git status --short src/lib/` and revert any change there — none of the four vendored paths
(`qrcodegen.ts`, `open-graph-scraper/**`, `bencode/**`, `fix-image-orientation/**`) should be
touched by this phase.

### The 6 (really: 6 named + qrcodegen) contaminated files — per-file diff shape

Actually running `aislop fix --safe .` (not dry-run) and diffing each named file:

| File | Import changes? | Comment-only lines removed | Verdict |
|------|------------------|------------------------------|---------|
| `src/components/webxdc/webxdc.tsx` | **None** | 20 (all `// ---` banner comments + one narrative block) | Full `git checkout --` is correct and equivalent to hunk-reversion |
| `src/components/webxdc/game-controls.tsx` | **None** | 6 | Full `git checkout --` |
| `src/views/signin/connect/index.tsx` | **None** | 2 | Full `git checkout --` |
| `src/views/webxdc/components/webxdc-player.tsx` | **None** | 6 | Full `git checkout --` |
| `src/services/pending-unlock.ts` | **None** | 7 (one large banner block above `attemptedAutoUnlocks`) | Full `git checkout --` |
| `src/services/wallets.ts` | **Yes** — merges `import { parseBolt11, parseLNURLOrAddress } from "..."` + `import type { EncryptedContentCache } from "..."` into one `import { parseBolt11, parseLNURLOrAddress, type EncryptedContentCache } from "..."` | 6 (`// ---- <section> ----` banners) | **Needs selective hunk reversion** — revert only the 6 comment-banner removals, keep the import merge |
| `src/lib/qrcodegen.ts` (not named in D-03, discovered here) | None | 17 (4 docstring blocks) | Revert entirely — vendored/excluded, out of scope regardless of comment content |

**Revised D-03 remedy for the planner:** `git checkout -- <file>` for the 5 comment-only files (and
`qrcodegen.ts`), then hand-edit `wallets.ts` to restore only its 6 `// ---- ... ----` banner
comments (all single-line, all immediately above a top-level declaration — easy to reintroduce
without touching the merged import). Confirm afterward with
`git diff src/services/wallets.ts` that the only surviving change is the import merge.

### Idempotency

Running `aislop fix --safe --dry-run .` again immediately after the fix reports `0` findings for
all three fixable steps. The fixer is idempotent. `[VERIFIED: reproduced in worktree]`

### Import grouping preserved

No import was moved across the external → internal → feature-local boundary
(CONVENTIONS.md § Import Organization). The duplicate-import merge keeps the merged import at its
**first** original position and deletes the later duplicate line(s) in place — confirmed on
`src/views/feeds/outboxes/outbox-feed.tsx` (two separate `applesauce-core/helpers` imports merged
at the position of the first) and `src/views/lists/list/follow-set.tsx` (6 unused imports deleted
in place, remaining import order and grouping unchanged). `[VERIFIED: reproduced in worktree]`

### Post-fix bucket-C measurement (before reverting narrative comments)

```
417 total -> 155 total   (262 findings cleared by 132 nominal auto-fixes)
```

Per-rule:

| Rule | Before | After full `--safe` fix | Delta |
|------|--------|---------------------------|-------|
| `ai-slop/unused-import` | 85 | 0 | -85 |
| `ai-slop/duplicate-import` | 47 | 0 | -47 |
| `import/no-duplicates` | 51 | **4** | -47 |
| `eslint/no-unused-vars` | 208 | **125** | **-83** (not the 58-floor D-02a states; confirms "larger-than-expected drop is not an error") |
| `eslint/no-unreachable` | 9 | 9 | 0 (not auto-fixable) |
| `eslint/no-unused-expressions` | 6 | 6 | 0 (not auto-fixable) |

`[VERIFIED: reproduced in worktree, jq-filtered scan]`

**The residual 4 `import/no-duplicates` findings** are not the 3 files D-02a's "44 of 47 shared"
framing implies:

```
src/components/embed-event/card/embedded-zap-receipt.tsx   (predicted, ai-slop/duplicate-import-only)
src/components/layout/presets/app-tabs-layout.tsx           (predicted, ai-slop/duplicate-import-only)
src/components/timeline/highlight.tsx                       (predicted, ai-slop/duplicate-import-only)
src/views/badges/badge-details.tsx                          (NOT predicted — was in the shared 44)
```

`badge-details.tsx` has `@chakra-ui/react` imported once in the top external-import block
(`Button, Flex, Heading, ...`) and again lower down (`import { useDisclosure } from "@chakra-ui/react"`)
mixed in with internal imports; same for `nostr-tools` (`kinds` vs. `NostrEvent`). The
`ai-slop/duplicate-import` fixer merges same-file duplicate imports **within** a contiguous import
group but does not merge across the blank-line group boundary that separates
external-library imports from internal/feature imports. **Expect 4, not 3, residual
`import/no-duplicates` findings after the auto-fix commit; `badge-details.tsx` needs a manual
one-line merge** (moving `useDisclosure` up into the top `@chakra-ui/react` import, and `NostrEvent`
up into the top `nostr-tools` import) as part of D-14's cleanup, or accept it as a manual-remedy
task alongside D-06/D-07 work on that file (it also has 1 unused-param-adjacent finding — check at
execution time).

## Architecture Patterns

### System Architecture Diagram

Not applicable in the conventional sense — this phase does not add a data-flow path. The relevant
"flow" is the verification loop the plan will run repeatedly:

```
 source file (src/**/*.{ts,tsx})
        |
        v
 aislop scan --json .  ---->  .diagnostics[] (rule, severity, filePath, line, fixable)
        |
        v
 jq filter (bucket-C rule allowlist)  ---->  per-rule count
        |
        +--> count > 0, rule fixable=true  --> aislop fix --safe . (own commit, D-04)
        |                                          |
        |                                          v
        |                                   revert narrative-comment hunks (D-03)
        |                                          |
        v                                          v
 count > 0, rule fixable=false  -->  hand-edit (D-05/D-06/D-07/D-08..D-13)  --> pnpm build (typecheck gate)
        |
        v
 re-scan --> count == 0 or documented ignore  -->  D-14 before/after table
```

### Recommended Wave/Plan Decomposition

Consistent with Phases 1–3's 5–6 plans across 2–3 waves. Two files each straddle two decision
categories and must not be touched by two plans in the *same* wave: `services/wallets.ts` (Wave 1
auto-fix touches its imports; a later wave's D-07 deletes its two dead constants) and
`views/lists/list/follow-set.tsx` (Wave 1 auto-fix removes ~8 unused imports; a later wave's D-07
deletes the dead `ListFeedButton` function — confirmed by direct inspection that these touch
disjoint line ranges, so sequencing across waves is sufficient, no line-level conflict). Both are
naturally resolved by making the auto-fix its own first wave, per D-04.

**Wave 1 (must land first — every later wave's files may already have been touched by it):**

- **Plan 1 — Auto-fix commit (D-03/D-04/D-04a).** Run `aislop fix --safe .`, revert the 5
  comment-only files + `qrcodegen.ts` wholesale, hand-revert `wallets.ts`'s comment hunks only,
  confirm `git status --short src/lib/` is clean, confirm post-fix counts via the jq commands
  above, commit alone. This is the "genuinely reviewable" commit the ROADMAP and D-03's "Specific
  Ideas" note require — a reviewer should be able to skim it and see only import lines (plus the
  one legitimate wallets.ts merge) changing.

**Wave 2 (blocked on Wave 1):**

- **Plan 2 — D-05 unused catch bindings (24 sites → bare `catch {`).** Mechanical, same shape as
  Phase 3's established pattern; low risk, high site count, worth its own plan.
- **Plan 3 — D-06 unused parameters (57 sites).** Judgment-heavy (contract-bound `_`-prefix vs.
  free deletion); `components/markdown/markdown.tsx` alone carries 10 of the 57 — worth
  investigating as a sub-task since markdown-it renderer-rule callback signatures are almost
  certainly contract-bound (positional callback params can't be reordered, but trailing ones may
  still be droppable — verify per-site, do not assume the whole file is one pattern).
- **Plan 4 — D-07 dead declarations (24 sites) + D-13 Phase 3 residue (3 sites).** Grouped because
  both are "delete now-redundant code, `pnpm build` is the backstop" — no auto-fix or ignore
  involved. Includes the `services/sqlite/index.ts:43` `dbName` deletion (D-09 explicitly carves
  this one out of the sqlite exception) and the `wallets.ts` constant deletion (now safe since
  Wave 1 already resolved that file's import state). Flag the `setParams` (`views/feeds/dvm/feed.tsx:78`)
  special case — delete only the destructured setter, not the `useState` line — and the
  hook-return-value cases (`locked`, `muted`, `autoDecryptMessages`) as requiring a closer look
  (see Common Pitfalls) before a blanket "delete the line."
- **Plan 5 — Deliberate exceptions (D-08/D-09/D-10/D-11/D-12/D-12a) + 11 single-instance cleanup
  rules (D-02 last row).** All of these are one-off, per-site judgment calls with no shared
  mechanical pattern; grouping them avoids a 6-plan phase turning into 10. Includes the
  `sqlite/index.ts:9-15` ignore (co-located with Plan 4's `dbName` deletion in the same file —
  consider merging Plan 4 and this sqlite portion into a single task if the executor finds the
  file being touched twice awkward; both edit disjoint line ranges so either grouping works).

This is 5 plans across 2 waves — within the established range, tighter than Phase 1/3's 6 because
this phase has fewer wave-ordering dependencies (nothing here is "risk first" the way Phase 3's
decryption paths were).

### Anti-Patterns to Avoid
- **Running `aislop fix` without `--safe`:** silently deletes 168+79+705 findings' worth of code
  outside bucket C with no per-site review (D-04a).
- **Blanket `git checkout --` across all 6 named D-03 files:** wrong for `wallets.ts`, which loses
  a legitimate import merge (D-03's own explicit warning, confirmed empirically above).
- **Assuming `.aislop/config.yml`'s `exclude:` list protects vendored code from `aislop fix`:** it
  does not — verify `src/lib/` is untouched after every fixer run.
- **Deleting a `useState` setter's whole declaration when only the setter is unused:** breaks the
  reader half. Use `const [params] = useState(...)`, not `const [, setParams] = useState(...)`'s
  mirror-image deletion of the whole line.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unused-import / duplicate-import detection & removal | A custom import-pruning script or manual per-file audit | `aislop fix --safe .`, already proven idempotent and grouping-preserving | The tool already does this correctly for 132/417 findings; hand-rolling risks reordering imports against CONVENTIONS.md |
| Detecting "is this really dead" for the 24 D-07 targets | Trusting the lint message alone | `grep -rn "<name>" src/` + `pnpm build` (TypeScript's unused-symbol/type-error surface) as the two-step backstop, per D-07's own text | A grep miss (e.g. dynamic `import()`, string-keyed route table, or JSX-only usage) would not be caught by the lint rule either — both signals are needed |

**Key insight:** aislop's own fixable/non-fixable split already encodes the "safe to automate"
boundary correctly for this project's config; the residual manual work (D-05 through D-13) is
exactly the set of decisions that could not be made safe to automate, which is why this phase
treats each of those categories as a distinct, reviewable plan rather than a single sweep.

## Runtime State Inventory

Not applicable — this is a source-code hygiene sweep with no rename, rebrand, or data-migration
component. No stored data, live service config, OS-registered state, secrets, or build artifacts
carry the identifiers being touched (unused imports, dead local variables, catch bindings). The
one file with genuine "guarded platform code" (`services/sqlite/index.ts`) is explicitly kept, not
renamed or migrated (D-09).

## Common Pitfalls

### Pitfall 1: Treating all 6 D-03 files identically
**What goes wrong:** Running `git checkout -- <file>` on `wallets.ts` (or hand-reverting comment
hunks in the other 5 when a whole-file revert would do) either loses a legitimate import fix or
does unnecessary manual hunk surgery.
**Why it happens:** D-03's prose treats the 6 files as one category ("may also have legitimate
in-scope import fixes"), but empirically only 1 of the 6 actually has one.
**How to avoid:** Use the per-file table in Auto-Fix Mechanics above; only `wallets.ts` needs hunk-
level care.
**Warning signs:** `git diff <file>` after reverting shows anything other than pure `import`-line
changes (for `wallets.ts`) or is empty (for the other 5, confirming the revert was complete).

### Pitfall 2: `aislop fix --safe` touching vendored/excluded paths
**What goes wrong:** `src/lib/qrcodegen.ts` (and potentially the other three vendored paths, if
they happen to carry narrative-comment findings not present in this run) get modified even though
`.aislop/config.yml` excludes them from scoring.
**Why it happens:** The `exclude:` config key governs scan/scoring, not the fixer's file
selection.
**How to avoid:** Run `git status --short src/lib/` immediately after `aislop fix --safe .` and
revert any change found there, every time — not just once at plan-writing time.
**Warning signs:** A diff touching `src/lib/**` appears in what should be an import-only commit.

### Pitfall 3: Deleting a hook call for its unused return value
**What goes wrong:** `const locked = useEventModel(GiftWrapsModel, [account.pubkey, true]);` (and
similarly `muted`, `autoDecryptMessages`) looks like an ordinary dead local variable, but the
right-hand side is a live hook call, not a pure expression. Deleting the *whole statement* (as
D-07 literally instructs — "delete the declaration") removes the hook invocation itself, not just
an unused binding.
**Why it happens:** `eslint/no-unused-vars` flags the binding, not the expression producing it; the
mechanical remedy (delete the line) is correct for a plain `const x = 5;` but conflates "unused
value" with "unused call" for anything with a side effect.
**How to avoid:** For the 3 flagged sites (`views/messages/index.tsx:171`, `views/messages/group/index.tsx:86`,
`views/user/tabs/lists.tsx:23`), confirm via the applesauce pattern (AGENTS.md: `useEventModel` is
a reactive EventStore query, not a fetch trigger) that deleting the call has no side effect before
deleting; if in doubt, keep the call and prefix the binding with `_` instead of deleting the
statement (a deviation from D-07's literal instruction, worth surfacing to the user as a
plan-time judgment call rather than assuming). `[ASSUMED: EventModel side-effect-free — inferred
from AGENTS.md's Applesauce Pattern section, not independently verified against applesauce's
source in this session]`
**Warning signs:** After deletion, `pnpm build` still passes (TypeScript won't catch a missing
side effect) but a feature that depended on the model being "warmed" elsewhere silently stops
updating — not mechanically detectable, call out as residual risk in Validation Architecture.

### Pitfall 4: `useState` tuple with only the setter unused
**What goes wrong:** `const [params, setParams] = useState<Record<string, string>>({});` in
`views/feeds/dvm/feed.tsx:78` — `params` is used (`Object.entries(params)`), `setParams` is not.
Deleting the whole `const [params, setParams] = ...` line (as a literal reading of "delete the
declaration" would suggest) removes `params`, which is in use.
**Why it happens:** The lint message reports the unused binding by name (`setParams`), not the
statement; D-07's remedy language ("delete the declaration") is correct for the 17 single-binding
cases but ambiguous for this one array-destructure case.
**How to avoid:** Rewrite to `const [params] = useState<Record<string, string>>({});` — dropping
only the second destructured element is valid TypeScript/JS and preserves `params`.
**Warning signs:** `pnpm build` fails with "params is not defined" if the whole line is deleted —
this one is TypeScript-catchable, unlike Pitfall 3.

## Code Examples

### D-05 remedy shape (established Phase 3 pattern, reused here)
```typescript
// Before
} catch (err) {
  // parse failure ignored
}

// After — matches AGENTS.md § Swallowed Exceptions "Deliberate parse/filter guard"
} catch {
  // parse failure ignored
}
```
Confirmed empirically: this clears `eslint/no-unused-vars` and does not trigger
`ai-slop/swallowed-exception` as long as the block is not literally empty. Source: reproduced in
worktree probe, this session.

### D-06 remedy shape — contract-bound (keep, prefix)
```typescript
// Before — Unused parameters should start with a '_' (the lint message itself)
items.map((item, index) => renderItem(item))

// After
items.map((item, _index) => renderItem(item))
```

### D-06 remedy shape — freely trailing (delete)
```typescript
// Before
function handler(event: Event, unusedContext: Context) { ... }

// After — only if no caller passes a second argument
function handler(event: Event) { ... }
```

### D-13 remedy shape (all 3 sites, identical pattern)
```typescript
// Before — src/helpers/nostr/goal.ts:107-111
export function safeValidateGoal(goal: NostrEvent) {
  try {
    return validateGoal(goal);
  } catch {
    // Goal event failed validation; callers filter it out
    return false;
  }
  return false; // <-- unreachable, delete this line
}

// After
export function safeValidateGoal(goal: NostrEvent) {
  try {
    return validateGoal(goal);
  } catch {
    // Goal event failed validation; callers filter it out
    return false;
  }
}
```
Confirmed identical shape (array-callback try/catch, not a named function) in
`content/transform/nip-notation.ts:47` and `content/transform/bip-notation.ts:47`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Manual per-file import cleanup | `aislop fix --safe` (3-step: unused/duplicate imports, narrative comments) | Phase 2 (aislop adoption) | This phase is the first to exercise the fixer at scale; its blind spots (vendored-path leakage, cross-group duplicate merge gaps) are now known and documented above rather than discovered mid-execution |

**Deprecated/outdated:** None — this is the first hygiene sweep of this kind; nothing prior to
compare against.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `useEventModel`/`useUserMutes` hook calls with unused return values have no side effect beyond the reactive subscription itself, so deleting the whole statement is safe | Common Pitfalls, Pitfall 3 | If a model's subscription has a side effect this session did not verify (e.g. triggering a one-time cache warm relied on elsewhere), deleting `locked`/`muted`/`autoDecryptMessages` could silently regress a feature with no build-time or lint-time signal — `pnpm build` will not catch it |
| A2 | `markdown.tsx`'s 10 unused-parameter findings are markdown-it renderer-rule callback signatures and therefore mostly contract-bound (`_`-prefix, not delete) | Architecture Patterns, Plan 3 | Not independently verified per-site in this session (time-boxed); if some are genuinely trailing/droppable the plan should still check individually rather than assume the whole file is one pattern |

**All other claims in this document were verified empirically in a disposable worktree this
session** (aislop scan/fix output, grep confirmations, direct file reads) — see inline
`[VERIFIED: ...]` tags.

## Open Questions

1. **Will the D-06 markdown.tsx renderer-rule signatures actually accept `_`-prefix, or does
   markdown-it require exact parameter names for some rules?**
   - What we know: markdown-it renderer rules are plain JS functions called positionally; renaming
     an unused parameter to `_paramName` does not change call-site behavior.
   - What's unclear: Whether any of the 10 findings are actually *trailing* (droppable) rather than
     *middle* (must stay, prefix only) — not enumerated line-by-line in this session.
   - Recommendation: Plan 3's task should read each of the 10 sites individually rather than batch-
     apply one remedy to the whole file.

2. **Does the `wallets.ts` narrative-comment hunk reversion risk a merge/whitespace mismatch with
   the surrounding import-merge edit, given both land in the same file in the same commit?**
   - What we know: The two edits touch disjoint line ranges (import block at top, 6 standalone
     comment lines scattered through the file body) — confirmed via the full diff in this session.
   - What's unclear: Whether an executor's tooling (e.g. an automated patch-apply) will handle
     "keep this fixer output, restore these specific deleted lines" cleanly, or whether it's safer
     to just re-run `aislop fix --safe src/services/wallets.ts` in isolation and hand-edit from a
     clean base.
   - Recommendation: Simplest approach — start from the pre-fix `wallets.ts`, apply *only* the
     import merge by hand (one line change), skip running the fixer on this file at all. Avoids
     revert surgery entirely.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `aislop` (exact-pinned devDependency) | All bucket-C scan/fix work | Yes | 0.16.1 | — |
| `pnpm` | Running scripts, worktree symlink workaround for `pnpm exec` in a fresh worktree | Yes | 11.2.2 | Invoke `./node_modules/.bin/aislop` directly if `pnpm exec` aborts on a lockfile-freshness prompt in a disposable worktree (non-interactive `pnpm install` abort observed this session) |
| `node` | Runtime for `aislop`, `vite`, `tsc` | Yes | v26.4.0 | — |
| `git worktree` | Recommended for any live-fire testing of `aislop fix` before committing to the real tree | Yes | — | — |

No missing dependencies; nothing blocks this phase from proceeding immediately.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **None** — no `*.test.*`/`*.spec.*` files exist and no test runner is a dependency (confirmed via `find` and `.planning/codebase/CONCERNS.md`, same state as Phase 3's precedent) |
| Config file | none |
| Quick run command | jq-filtered rescan, single count (see below) |
| Full suite command | jq-filtered per-file rescan + `pnpm lint:ci` + `pnpm build` |

The verification signal is a scoped lint rescan, not a test suite (D-14, following Phase 3's D-04
precedent). `aislop scan` has no `--rule` flag; the bucket-C filter is applied with `jq`.

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
Reads `417` today. Must read a number consistent with D-01's completion bar (every remaining
finding either 0, or explicitly accounted for by a documented ignore) at phase completion — unlike
Phase 3, this is not guaranteed to reach exactly `0`, since D-08/D-09/D-10/D-11 keep some findings
behind ignores. The gate is "every survivor has a rule-scoped ignore with a reason," checked by
the full-form command below, not a bare zero.

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
Then `pnpm lint:ci` (from a feature branch, `git fetch origin next` first per AGENTS.md) and
`pnpm build` (typecheck — the real backstop for D-07's deletions).

### ⚠ Pitfall — never assert on the scan's exit code
`pnpm exec aislop scan --json .` exits `1` even on success (bare `aislop scan` exits non-zero
while any finding exists anywhere in the repo — always true). Assert on jq output only, per Phase
3's `03-VALIDATION.md` precedent.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01/D-14 | Every bucket-C finding fixed or ignored | scoped-rescan | Full form above, cross-checked against the documented-ignores list | N/A — the scan is the check |
| D-03/D-04 | Auto-fix is its own commit, no comment-noise survives | commit-order review + `git diff` | `git log --oneline` shows the auto-fix commit alone touching import lines only | N/A |
| D-05 | 24 catch bindings → bare `catch {}`, no new swallowed-exception | scoped-rescan | Quick form scoped to touched files; confirm 0 `ai-slop/swallowed-exception` | N/A |
| D-06 | 57 params `_`-prefixed or deleted | scoped-rescan | Quick form scoped to touched files | N/A |
| D-07 | 24 declarations deleted, no orphaned references | grep + typecheck | `grep -rn "<name>" src/` returns nothing + `pnpm build` passes | N/A |
| D-08–D-12a | Ignores present, rule-scoped, reasoned | manual review + scoped-rescan | `grep -n "aislop-ignore"` at each site; confirm scan still reports 0 *other* rules on that line | N/A |
| D-13 | 3 redundant `return false;` deleted, swallowed-exception still clears | scoped-rescan | Quick form on the 3 files; confirm `ai-slop/swallowed-exception` still 0 (Phase 3's bar) | N/A |
| D-15 | 3 pre-existing hook-order errors untouched | source assertion | `git show` at merge-base confirms lines 55/57/59 of `app-handler-modal/index.tsx` predate this phase | N/A |

### Sampling Rate
- **Per task commit:** quick-form jq count, scoped to touched file(s) via `--include`, or whole-
  repo with an expected-delta check
- **Per wave merge:** full-form per-file table, diffed against this document's 417-baseline table
  for Wave 1, and against the Wave-1-complete state for Wave 2
- **Phase gate:** full form shows every remaining finding accounted for by a documented ignore,
  `pnpm lint:ci` passes, `pnpm build` passes

### Wave 0 Gaps
None — no test infrastructure to bootstrap, consistent with Phase 3's D-04 precedent. The aislop
scan itself is the existing infrastructure this phase's verification reuses.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Not touched by this phase |
| V3 Session Management | No | Not touched by this phase |
| V4 Access Control | No | Not touched by this phase |
| V5 Input Validation | No | This phase deletes/prunes code, does not add input-handling paths |
| V6 Cryptography | No | `services/sqlite/index.ts`'s `encrypted: boolean` parameter is untouched — D-09's exception only concerns the unreachable web-guard block, not the encryption path itself |

### Known Threat Patterns for this stack
None apply. This is a mechanical dead-code/import-hygiene sweep with no new attack surface,
network call, or trust boundary. The one behavior-adjacent change (D-12's `cleanup;` → `cleanup();`
fix in `components/pow/mine-pow.tsx`) was confirmed in this session to be a genuine bug fix, not a
security-relevant change: `cleanup` is declared via `const cleanup: MinerCleanup = () => {...}` at
line 61 and referenced inside `handleMessage`, a Worker `onmessage` callback that only executes
asynchronously after the synchronous setup (including `cleanup`'s declaration) completes — so
`cleanup` is guaranteed to be initialized (out of TDZ) by the time it would actually be called.
`[VERIFIED: reproduced by reading the full function body this session]`

## Sources

### Primary (HIGH confidence)
- Live `aislop@0.16.1` CLI output (`scan --json`, `fix --safe`, `fix --safe --dry-run`), reproduced
  in a disposable detached git worktree this session — every count and diff-shape claim above.
- Direct file reads of the actual source at the flagged lines (`services/sqlite/index.ts`,
  `services/wallets.ts`, `views/lists/list/follow-set.tsx`, `components/pow/mine-pow.tsx`,
  `components/content/transform/{nip,bip}-notation.ts`, `helpers/nostr/goal.ts`,
  `views/badges/badge-details.tsx`, and all 24 D-07 targets).
- `AGENTS.md` § Linting, § Inline ignores, § Swallowed Exceptions, § Import Conventions.
- `.planning/codebase/CONVENTIONS.md` § Import Organization.
- `.aislop/config.yml` (adopted rule policy, not modified).

### Secondary (MEDIUM confidence)
- `.planning/phases/03-audit-swallowed-exceptions-and-silent-failure-paths/03-VALIDATION.md` — the
  Validation Architecture shape this document follows.
- `.planning/codebase/CONCERNS.md` — confirms no test infrastructure exists project-wide.

### Tertiary (LOW confidence)
- The applesauce `useEventModel`/`useUserMutes` side-effect-free assumption (A1 in Assumptions
  Log) — inferred from AGENTS.md's documented pattern, not independently verified against
  applesauce's source in this session.

## Metadata

**Confidence breakdown:**
- Auto-fix mechanics (D-03/D-04): HIGH — fully reproduced empirically, including one correction to
  D-03's own file/finding count (qrcodegen.ts) and one correction to D-02a's residual-count
  estimate (4 vs. implied 3)
- Mechanical remedies (D-05/D-06): HIGH — both the bare-catch and `_`-prefix behaviors were
  isolated and confirmed with a minimal reproduction
- Dead-declaration safety (D-07): MEDIUM-HIGH — all 24 sites grepped and read; 2 categories flagged
  as needing extra care (hook-return-value deletions, `useState` tuple) rather than assumed safe
- Deliberate exceptions (D-08–D-13): HIGH for D-09/D-12/D-13 (verified against live code); MEDIUM
  for D-10/D-11/D-12a (trusted from CONTEXT.md's own research, not independently re-derived this
  session since they were already well-evidenced there)
- Validation architecture: HIGH — directly modeled on Phase 3's precedent with this phase's actual
  rule set substituted in

**Research date:** 2026-09-15
**Valid until:** Re-verify counts at plan/execution time regardless of date — D-02/D-02a already
establish that even a same-day re-measurement can drift from a stated baseline. Treat this
document's exact numbers as a snapshot from `92f2d8a19`, not a guarantee.
