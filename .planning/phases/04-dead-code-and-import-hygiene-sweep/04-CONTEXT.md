# Phase 4: Dead code and import hygiene sweep - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

Unused variables, unused and duplicated imports, and unreachable code are gone from `src/`, with
the mechanically auto-fixable share applied in its own reviewable commit and each deliberate
exception either documented with a rule-scoped ignore or removed as an explicit decision.

In scope: bucket C of the [2026-09-11 baseline](../../research/aislop-scan-2026-09-11.md) —
`eslint/no-unused-vars`, `ai-slop/unused-import`, `import/no-duplicates`,
`ai-slop/duplicate-import`, `eslint/no-unused-expressions`, `eslint/no-unreachable`,
`ai-slop/unreachable-code`, `ai-slop/empty-function`, plus the ~9 single-instance cleanup rules
(`unicorn/no-useless-spread`, `typescript/no-unnecessary-parameter-property-assignment`,
`eslint/no-extra-boolean-cast`, `unicorn/no-new-array`, `eslint/no-shadow-restricted-names`,
`eslint/no-useless-rename`, `unicorn/no-useless-length-check`).

Out of scope: every other bucket. In particular `ai-slop/narrative-comment` and
`ai-slop/trivial-comment` (bucket G / backlog 999.8) must not be swept in, even though the
auto-fixer offers to do it — see D-03.

</domain>

<decisions>
## Implementation Decisions

### Scope & completion

- **D-01:** Done means **every bucket-C finding in `src/` is either fixed or carries a
  rule-scoped `aislop-ignore-*` with a reason** (D-08). No bucket-C finding is left
  un-triaged. The bar is measured by a scoped rescan (D-14), following the Phase 3 D-04
  precedent. Warnings are the whole bucket here — unlike Phase 3 there is no error-severity
  subset to fall back on, so "documented or removed" is the completion test, not a count
  of errors.

- **D-02:** **The measured starting point is 417, not the ROADMAP's 445.** A fresh
  `pnpm exec aislop scan --json .` on `next` @ `35cc199bd` gives:

  | Rule | Now | Baseline | Fixable |
  |---|---|---|---|
  | `eslint/no-unused-vars` | 208 | 239 | 0 |
  | `ai-slop/unused-import` | 85 | 85 | **85** |
  | `import/no-duplicates` | 51 | 51 | 0 |
  | `ai-slop/duplicate-import` | 47 | 47 | **47** |
  | `eslint/no-unreachable` | **9** | 6 | 0 |
  | `eslint/no-unused-expressions` | 6 | 6 | 0 |
  | remaining single-instance rules | 11 | 11 | 0 |
  | **total** | **417** | 445 | **132** |

  Phase 3's D-06 bare-catch work already cleared ~28 `no-unused-vars`. The planner should
  re-measure rather than trust either number.

- **D-02a:** **The 417 overstates the distinct work.** 101 of the 208 `no-unused-vars` are
  `"is imported but never used"` — the same lines `ai-slop/unused-import` reports. Measured
  overlap: 74 ai-slop sites, 96 eslint import sites, **58 at the identical `file:line`**. The
  real distinct import work is ~112 sites, not 186. Duplicate imports are near-identical sets
  (44 of 47 files shared; only 3 files are `import/no-duplicates`-only). Expect the 132
  auto-fixes to clear substantially more than 132 findings, and do not treat a
  larger-than-expected drop as an error.

### Auto-fix boundary

- **D-03:** `aislop fix --safe .` applies three steps, not two: unused imports (85 in 57
  files), duplicate imports (47 in 44 files), **and narrative comments (21 in 6 files)**.
  There is no `--rule` flag to exclude a step. The remedy is: **run the fix, then revert the
  narrative-comment hunks before staging.** The 6 contaminated files are:

  - `src/components/webxdc/webxdc.tsx` (8)
  - `src/services/wallets.ts` (6)
  - `src/components/webxdc/game-controls.tsx` (2)
  - `src/views/signin/connect/index.tsx` (2)
  - `src/views/webxdc/components/webxdc-player.tsx` (2)
  - `src/services/pending-unlock.ts` (1)

  Note these files may *also* have legitimate in-scope import fixes, so a blanket
  `git checkout --` of the whole file is wrong — revert the comment hunks only, and verify
  with `git diff` that what remains in each of the 6 is import-only. Backlog 999.8 must be
  left exactly as it was. Explicitly rejected: accepting the comment cleanup as a bonus
  (contradicts `.claude/CLAUDE.md`'s no-sweep override), and skipping the 6 files entirely
  (loses their real import fixes).

- **D-04:** The auto-fix lands in **its own commit**, separate from every manual change, so a
  reviewer can diff mechanical churn apart from judgment calls. This is the ROADMAP's explicit
  ask ("the mechanically auto-fixable share applied in its own reviewable commit").

- **D-04a:** Do **not** use `aislop fix` without `--safe`. The non-safe plan adds "Dead code &
  comments" (168 findings, 54 files), "Unused declarations" (79 in 57) and "Lint fixes (js/ts)"
  (705 in 316) — which reach far outside bucket C and would delete code without per-site
  judgment. The 24 dead declarations are handled by D-07 deliberately, by hand.

### Mechanical remedies

- **D-05:** The 24 **unused catch bindings** (`Catch parameter 'X' is caught but never used`)
  become bare `catch {`. This directly continues Phase 3's D-06 and matches the shape now
  documented in `AGENTS.md` § Swallowed Exceptions. These are the sites Phase 3 did not reach
  because it only rewrote lines it was already touching.

- **D-06:** The 57 **unused parameters** (`Unused parameters should start with a '_'`) get the
  `_` prefix **where the signature is fixed by an API or callback contract** (event handlers,
  `.map((x, i) =>)`, applesauce/React callbacks, interface implementations), and are **deleted
  where the parameter merely trails the signature** and no caller passes it. The lint message
  itself prescribes the `_` convention, so the prefix is the tool-sanctioned form. Explicitly
  rejected: `_`-prefixing everything (leaves genuinely dead trailing params in signatures), and
  deleting everything possible (largest diff, most breakage risk on contract-bound signatures).

### Dead declarations

- **D-07:** All **24 genuinely-dead declarations are deleted** — git history is the record.
  This includes the four dead functions/components and the two config-shaped constants, which
  are declared but never exported and never referenced:

  - `src/services/notifications/threads.ts:86` `isDirectReply`
  - `src/components/blob-details-modal.tsx:129` `RepairBlobButton`
  - `src/views/pictures/picture/index.tsx:25` `Header`
  - `src/views/lists/list/follow-set.tsx:42` `ListFeedButton`
  - `src/services/wallets.ts:33-34` `SUGGESTED_MINTS`, `DEFAULT_WALLET_RELAYS`
  - plus 18 dead local variables (`highlightText`, `context`, `address`, `isSpecialList`,
    `url`, `loadingProfiles`, `dbName`, `info`, `authors`, `loading`, `locked`, `navigate`,
    `intent`, `autoDecryptMessages`, `muted`, `setParams`, `lookupPromise`, `bestHash`)

  Before deleting a component, confirm with grep that nothing references it by name —
  TypeScript's unused check plus `pnpm build` is the backstop. Explicitly rejected: keeping
  the wallets constants behind an ignore (they are unwired config, not deliberate exceptions —
  if wallets needs them later, git has them).

### Deliberate exceptions

- **D-08:** The policy for load-bearing code that *looks* dead is a **rule-scoped
  `aislop-ignore-*` directive naming the rule and ending with `-- reason`**, per `AGENTS.md`
  § Inline ignores and Phase 2's D-12 / Phase 3's D-07. The reason must justify **why the code
  could not be fixed instead**, not merely that it is deliberate. A `-line` / `-next-line`
  directive must sit textually adjacent to the flagged line. Explicitly rejected: restructuring
  each site to need no ignore (best end state but real behavior-change risk in a hygiene phase).

- **D-09:** `src/services/sqlite/index.ts:9-15` — the six lines below the `CAP_IS_WEB` guard
  `throw` (the `jeep-sqlite` dynamic import and web-store init) are **kept and ignored**, not
  deleted. This is the ROADMAP's named exception and Phase 3's D-13 flagged the file as shared
  between the two phases. Note the file carries **8** bucket-C findings, not 6: the 6
  `no-unreachable` plus 1 `ai-slop/unreachable-code` at line 9, plus a genuinely dead
  `const dbName` at line 43 inside `deleteDatabase` — that last one is **not** an exception and
  is deleted under D-07.

- **D-10:** `src/components/magic-textarea.tsx:25` — `[Textarea, Input];` is a deliberate
  import-retention hack and already carries a comment saying so. **Kept and ignored.** It must
  be ignored rather than removed, because deleting the expression would make both imports
  unused and the D-03 auto-fixer would then strip them.

- **D-11:** `src/components/post-modal/index.tsx:102` and
  `src/views/new/note/short-text-form.tsx:98` — `formState.isDirty;` is react-hook-form's
  getter-subscription idiom; the bare property read is what registers the subscription.
  **Kept and ignored.** Deleting it silently breaks form reactivity with no type error.

- **D-12:** `src/components/pow/mine-pow.tsx:47` — `cleanup;` is a **genuine bug**, not an
  idiom: a bare identifier reference where a call was intended, carrying a copy-pasted comment
  (`// Call stopMiner when mining is complete`) duplicated from the line above. Fix it to
  `cleanup()` and correct the comment. Verify `cleanup` is actually callable at that point
  before changing behavior — if it is not, the correct fix may be deletion instead; say which
  in the summary.

- **D-12a:** `src/components/content/components/gallery.tsx:24` and
  `src/components/content/links/image.tsx:67` — `!e.isPropagationStopped() && show();` is a
  plain short-circuit statement with no framework meaning. Rewrite as
  `if (!e.isPropagationStopped()) show();`. No ignore needed.

### Phase 3 residue

- **D-13:** `eslint/no-unreachable` rose **6 → 9**. The three new sites were introduced by
  Phase 3 commit `b188fe526` ("fix(03-02): apply D-05 parse-guard remedy to six catch sites"),
  which added `return false;` inside catches that already had a trailing `return false;` after
  the try/catch:

  - `src/components/content/transform/nip-notation.ts:47`
  - `src/components/content/transform/bip-notation.ts:47`
  - `src/helpers/nostr/goal.ts:109`

  The remedy is to **delete the now-redundant trailing `return false;`**, keeping the in-catch
  return that Phase 3 added (that one is what satisfies `ai-slop/swallowed-exception`, which is
  error-severity and gates CI — removing it would regress Phase 3's bar). This is Phase 4
  cleanup, not a Phase 3 re-open.

### Verification

- **D-14:** Verification is a **scoped rescan** with a per-rule before/after table (417 → N)
  and an explicit list of every site left standing behind an ignore, with its reason. Follows
  Phase 3's D-04 precedent: no new test framework, no manual UAT wave. `pnpm build` must pass
  after every task — it is the type-check gate and the real backstop for deletions.

- **D-15:** `pnpm lint:ci` is expected to still report the 3 pre-existing
  `react-hooks/rules-of-hooks` errors in `src/components/app-handler-modal/index.tsx`
  (backlog 999.2). That is not a Phase 4 regression and must not be fixed here — the same
  disposition Phase 3 recorded.

### Claude's Discretion

- The wave/plan split and per-file ordering of the manual work.
- Which specific parameters are contract-bound vs. freely deletable under D-06.
- Exact wording of each `-- reason` string, subject to D-08's justification bar.
- How to group the 11 single-instance cleanup rules (D-02's last row) into plans.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `aislop fix --safe [directory]` — scopes by directory (verified: `src/helpers` reports 5
  unused imports / 2 duplicate imports). No rule-level scoping exists.
- `pnpm build` (`tsc --project tsconfig.json && vite build`) is the type-check gate and the
  backstop that catches an over-eager deletion.
- `pnpm lint` (whole-repo report) and `pnpm lint:ci` (the changed-files gate). Per `AGENTS.md`,
  `pnpm lint` always exits non-zero — never chain it with `&&`.
- `pnpm exec aislop scan --json .` produces the `.diagnostics[]` array used for all counts
  above; each record carries `filePath`, `rule`, `severity`, `line`, `fixable`.

### Established Patterns

- **Rule-scoped ignores** (`AGENTS.md` § Inline ignores): must name the rule and end with
  `-- reason`. In-repo instances: `src/sw/client/error-logger.ts` (file-level,
  `ai-slop/console-leftover`) and `src/hooks/timeline/use-timeline-cache-key.ts` (next-line,
  hidden-fallback).
- **Bare `catch {`** is the established shape for a discarded caught binding (Phase 3 D-06,
  now documented in `AGENTS.md` § Swallowed Exceptions).
- **Relative imports** are preferred; `~/` exists but is rarely used (`AGENTS.md`,
  CONVENTIONS.md). The auto-fixer must not be allowed to rewrite import style.
- **Import grouping**: external libraries → internal modules → feature-local components
  (CONVENTIONS.md § Import Organization). Verify the duplicate-import fix preserves grouping.
- Components are default exports; internal JSX helpers are PascalCase even when not exported —
  which is why a dead `Header` / `ListFeedButton` reads as ordinary code and needs grep
  confirmation before deletion (D-07).

### Integration Points

- `.aislop/config.yml` — rule policy. **Not to be edited by this phase**; D-08 uses inline
  ignores, not config changes.
- `.github/workflows/lint.yml` → `pnpm lint:ci`, measured from
  `git merge-base origin/next HEAD`. Touching a legacy file inherits its errors, so a file this
  phase touches must leave no error-severity finding behind.
- Highest-concentration files (current scan): `views/lists/list/follow-set.tsx` (17),
  `components/outbox-relay-selection-modal.tsx` (13),
  `views/lists/components/fallback-list-card.tsx` (11),
  `views/messages/inbox/components/locked-messages.tsx` (11),
  `components/markdown/markdown.tsx` (10),
  `views/settings/profile/components/profile-edit-form.tsx` (9),
  `services/sqlite/index.ts` (8), `views/feeds/outboxes/outbox-feed.tsx` (7).

</code_context>

<specifics>
## Specific Ideas

- The ROADMAP's phrasing is the bar for D-08: each deliberate exception is "either documented
  or removed **as an explicit decision**" — an undocumented survivor is a failure even if the
  code is correct.
- The auto-fix commit must be genuinely reviewable: a reader should be able to skim it and see
  only import lines changing. If reverting the narrative-comment hunks (D-03) leaves a messy
  mixed diff in any of the 6 files, prefer hand-fixing that file's imports over shipping a
  commit that mixes concerns.
- Phase 3 established that a plan's own measured-fact tables can drift from reality between
  planning and execution. Re-measure at execution time and treat a mismatch as a documentation
  gap to correct, not a regression to investigate.

</specifics>

<deferred>
## Deferred Ideas

- `ai-slop/narrative-comment` / `trivial-comment` / `console-leftover` cleanup — backlog 999.8,
  explicitly fenced off by D-03.
- `react-hooks/rules-of-hooks` in `components/app-handler-modal/index.tsx` — backlog 999.2
  (D-15).
- `react-hooks/exhaustive-deps` — backlog 999.5.
- Restructuring the sqlite web guard so the unreachable block disappears without an ignore —
  considered and rejected under D-08/D-09 as behavior-change risk; revisit if web sqlite
  support is ever revived.
- `services/wallets.ts` wiring up `SUGGESTED_MINTS` / `DEFAULT_WALLET_RELAYS` as real config —
  deleted here (D-07); if wanted, it is a feature, not hygiene.

</deferred>
