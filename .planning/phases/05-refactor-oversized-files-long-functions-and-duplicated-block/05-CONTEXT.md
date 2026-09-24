# Phase 5: Refactor oversized files, long functions, and duplicated blocks - Context

**Gathered:** 2026-09-24
**Status:** Ready for planning

<domain>
## Phase Boundary

The files and functions that have outgrown themselves are split along real seams, duplicated
blocks are factored out where a real abstraction exists, and every thin wrapper is inlined,
deleted, or justified — so the remaining complexity findings reflect deliberate structure.

**In scope:** all 33 bucket-H findings measured on `next` @ `3e210b641` (2026-09-24), across
every file carrying one — not only the files the ROADMAP names (D-02):

| Rule | Count |
|---|---|
| `code-quality/duplicate-block` | 21 |
| `complexity/function-too-long` | 8 |
| `complexity/file-too-large` | 2 |
| `ai-slop/thin-wrapper` | 2 |

Also in scope: correcting the stale ROADMAP Phase 5 entry (D-04), and a vitest harness scoped
to the pure functions this phase creates (D-15).

**Out of scope:** every other bucket. In particular `react-hooks/exhaustive-deps` (backlog
999.5), `rules-of-hooks` (999.2), and comment/console noise (999.8) must not be swept in, even
where they sit in a file this phase restructures. Consolidating the three sibling napplet
services (D-11) and splitting the three oversized page components (D-12) are explicitly excluded.

</domain>

<decisions>
## Implementation Decisions

### Scope & completion

- **D-01:** Done means **every bucket-H finding is either fixed or carries a rule-scoped
  `aislop-ignore-*` with a reason**. No finding is left un-triaged. This follows P3 D-01 /
  P4 D-01 — but note it is a *chosen* bar here, not a mechanical one: **every bucket-H rule is
  warning severity**, so unlike Phase 3 nothing in this phase gates CI. The gate fails only on
  error-severity findings in touched files (`AGENTS.md` §Linting). Explicitly rejected: leaving
  false positives standing as documented-but-unmarked warnings.

- **D-02:** **All 33 findings are in scope, including the 14 in files the ROADMAP never names.**
  The phase is defined by the bucket, not by the ROADMAP's illustration of it. Roadmap-named
  files account for 19 findings; the other 14 are 8 `duplicate-block` (code.tsx, youtube.tsx,
  magic-textarea, error-logger, groups, list-history-modal, direct-message-form,
  service-worker-status-card) and 6 `function-too-long`. Explicitly rejected: fixing only the
  named targets and clearing the strays with "out of scope" ignores, which fails the D-08-style
  justification bar.

- **D-03:** **The measured starting point is 33 findings at repo score 85/100 (694 total
  findings)**, not the ROADMAP's 2026-09-11 numbers (78/100, 1,196 findings). Per-rule counts
  are unchanged except `function-too-long` 7 → 8, but **which files carry them has drifted**.
  Following P4 D-02, the planner must **re-measure** rather than trust either number.

- **D-04:** The **ROADMAP.md Phase 5 entry is corrected as part of this phase**, before planning
  completes, so downstream agents read accurate targets. It is stale in three specific ways: it
  leads with `torrents.ts (5 duplicate blocks)` as a real target when those are entries in a
  static data table (D-06); it describes `napplet-shell-provider.tsx` as ">600 lines" when it is
  **1162**; and it frames `relay-stats.ts` as a thin wrapper to "inline or justify" when
  `getRelayURL` is **dead code** (D-13). Use the `gsd-tools` roadmap handler — **never a direct
  Write/Edit to ROADMAP.md** (universal anti-pattern 15).

### Duplicate blocks

- **D-05:** The default for a borderline `duplicate-block` is **ignore-with-reason; extract only
  the clear wins.** Classified during discussion:

  **Extract (clear wins):**
  - `views/settings/background-worker/cached-files-card.tsx:95,122` and
    `service-worker-status-card.tsx:97` — hand-rolled `try/catch` + `toast` + `finally` handlers.
    See D-07: these are convention violations first, duplication second.
  - `components/magic-textarea.tsx:202` — `MagicInput` and `MagicTextArea` are twin `forwardRef`
    components differing only in element type, `textAreaComponent` and aria-label.
  - `views/messages/chat/components/direct-message-form.tsx:240` — twin inbox-list blocks (self
    vs. other pubkey) differing only in their label and source array.
  - `sw/client/error-logger.ts:56` — `logServiceWorkerErrors` and
    `logServiceWorkerErrorsByContext` share the whole `console.group` rendering loop.
  - `services/notifications/common.ts:91,118` — two `createTimelineLoader` calls differing only
    in their filter array; the shared options object is the extractable part. Thin but real.
  - `views/articles/components/article-reader.tsx:286,304` — three identical Slider
    `FormControl`s (Rate/Pitch/Volume) differing only in label, value, min/max/step.
  - `views/notifications/index.tsx:77,98` — the `metadata={count === 0 ? null : <Flex><Badge/>…}`
    block repeated across every `SimpleNavBox`.

  **Ignore-with-reason (coincidental shape, not shared meaning):**
  `components/content/links/code.tsx:40` + `youtube.tsx:58` (both wrap `ExpandableEmbed` but with
  different hosts, aspect ratios and iframe props), `views/groups/index.tsx:184` (SimpleGrid
  branches in a ternary chain), `views/lists/components/list-history-modal.tsx:279` (row-variant
  badge/ButtonGroup tails).

  Explicitly rejected: defaulting to extraction everywhere (largest diff of the phase, in
  untested view code), and per-site judgment with no default (unpredictable scope).

- **D-06:** `helpers/nostr/torrents.ts`'s **five findings get one file-level ignore**:
  `// aislop-ignore-file code-quality/duplicate-block -- torrentCatagories is a static taxonomy;
  repeated {name,tag} entries are independent data, not extractable code`. All five
  (`:119,121,131,150,152`) are leaves inside the `torrentCatagories` literal — repeated
  `{name:"Mac",tag:"mac"}` / `{name:"iOS",tag:"ios"}` entries across category subtrees. Follows
  the P2 D-11 file-level precedent. Explicitly rejected: five adjacent line-ignores (noisy inside
  a nested literal, and P3's probe found placement finicky), and hoisting the leaves into shared
  constants (destroys the readable taxonomy and implies independent leaves are the same thing).

- **D-07:** The three `try/catch` + `toast` handlers in `cached-files-card.tsx` and
  `service-worker-status-card.tsx` are **`useAsyncAction` convention violations first** —
  `AGENTS.md` §"useAsyncAction Hook (REQUIRED)" and P3 D-09 both mandate the hook for
  user-triggered async actions. Converting them is the remedy; clearing `duplicate-block` is a
  side effect. Note `useAsyncAction` toasts `e.message` and manages `loading`, replacing the
  hand-rolled `isClearingCache` / `isRefreshingCache` state. **Verify by rescan** that the
  conversion actually clears the finding before assuming it (P3's measured-remedy precedent).

### Oversized files

- **D-08:** `providers/global/napplet-shell-provider.tsx` (1162 lines, threshold 600) gets the
  **full split CONCERNS.md prescribes**: adapters promoted into `src/services/napplet-shell/*`,
  a thin provider left behind, and the modals moved out (D-09). Consumer churn is near zero —
  the file exports only `NappletShellProvider` and `useNappletShell`, imported from just three
  sites (`providers/global/index.tsx`, `views/napplets/napplet.tsx`,
  `components/napplets/napplet-frame.tsx`); everything else is module-private. The seams are
  already module-level functions, so most of the work is relocation, not redesign:

  | Region | Lines | Candidate module |
  |---|---|---|
  | intent service | 240–322 | `intent-service.ts` |
  | identity/profile/follows/reactions/reports | 337–504 | `common-actions.ts` |
  | blossom upload service | 512–556 | `upload-service.ts` |
  | resource service | 565–772 | `resource-service.ts` (also the `:610` long-function hit) |
  | bridge adapter | 781–960 | `adapter.ts` |
  | provider component | 962–1157 | stays, thinned |

  Watch the module-level mutable maps (`windowIdentities`, `approvedCapabilities`,
  `ALWAYS_ALLOW_STORAGE_KEY` localStorage access) shared across those regions — they must land in
  one owning module, not be duplicated. Explicitly rejected: splitting in place under
  `providers/global/` (leaves the services-vs-providers coupling CONCERNS.md objects to), and the
  minimum to clear thresholds (leaves the core problem intact).

- **D-09:** The two inline modals — consent (`:1085-1117`, "Grant napplet access?") and
  intent-choice (`:1118-1153`, "Choose a napplet") — move to **`components/napplets/`**, beside
  the existing `napplet-frame.tsx`, `napplet-info-drawer.tsx` and `napplet-menu.tsx`. Explicitly
  rejected: putting JSX under `services/` (cuts against the architecture's layer separation), and
  a third napplet UI location under `providers/global/`.

- **D-10:** `services/wallets.ts` (591 lines, threshold 400) becomes a **directory module split
  by backend**: `services/wallets/{types,webln,nwc,nutwallet,index}.ts`. **This is zero-churn for
  all ~13 import sites** — `tsconfig.json` sets `moduleResolution: "Bundler"` and the in-repo
  precedent is unanimous (`services/event-cache`, `services/database`, `services/sqlite` are all
  directories with `index.ts`, and every consumer imports the bare directory path, never
  `/index`). Seams: WebLN backend 137–193, NWC backend 194–283 (plus `waitForNwcPaid` /
  `fromNwcTransaction`), NutWallet backend 284–330; shared `WalletBackend` / `WalletTransaction`
  types into `types.ts` (6+ files already import these as types); state, reconciliation and the
  21-export public API stay in `index.ts`. **No import cycle constrains this** — `wallets.ts`
  imports `accounts`, `cashu-couch`, `decryption-cache`, `event-store`, `pool`, `preferences` and
  none import back; `wallet-migration.ts` imports *from* wallets and is a side-effect module
  loaded once at `index.tsx:16`. Explicitly rejected: types+backends only, and the arbitrary
  minimum-to-clear-400 seam (reads as a lint dodge).

- **D-11:** The three sibling napplet services — `services/installed-napplets.ts`,
  `services/napplet-intent-delivery.ts`, `services/recent-napplets.ts` — **stay where they are.**
  `services/napplet-shell/` holds only what comes out of the provider. They carry no bucket-H
  findings, and moving them would pull their existing findings into the diff under the whole-file
  gate. Explicitly rejected: absorbing them for tidiness (pure churn, zero findings cleared).

### Long functions

- **D-12:** The eight `function-too-long` findings are **split by kind**. Note aislop gives React
  components **2× the configured `maxFunctionLoc: 80`**, so components are measured against 160:

  **Extract (non-component, over the 80-line budget):**
  | Function | Actual | Over by |
  |---|---|---|
  | `hooks/use-webxdc.ts:22` `useWebxdc` | 234 | +154 |
  | `components/post-modal/index.tsx:160` `renderBody` | 146 | +66 |
  | `components/webxdc/webxdc.tsx:138` `handleRequest` | 102 | +22 |

  `useWebxdc` is 234 of its file's 257 lines and has clean seams: a kind-4932 subscription effect
  (40–58), an `updates` memo (60–86), two listener effects (87–109), identity derivation
  (110–117), and five `useCallback` API methods (`sendUpdate` 118, `setUpdateListener` 143,
  `getAllUpdates` 159, `sendToChat` 163, `importFiles` 167) — it divides naturally into sub-hooks.

  **Ignore-with-reason (page components, over the 160-line budget):**
  `views/new/poll/poll-form.tsx:72` `PollFormInner` (302), `views/relays/relay/tabs/about.tsx:47`
  `RelayPage` (229), `views/tools/event-publisher/index.tsx:40` `EventPublisherPage` (216). The
  reason is that the length is inherent JSX composition and splitting risks silent regressions in
  views with no test coverage. The two `napplet-shell-provider.tsx` hits (`:610`, `:962`) are
  resolved by D-08's split, not separately. Explicitly rejected: extracting all eight (largest,
  riskiest diff), and fixing only the worst two ("less bad than the others" fails the D-08 bar).

### Thin wrappers & dead code

- **D-13:** `helpers/nostr/relay-stats.ts` is **half-dead, and its dead symbols are deleted**:
  `getRelayURL`, `getRTT`, `getRTTTag`, and `MONITOR_METADATA_KIND`. Kept: `MONITOR_STATS_KIND`
  (used by `nip66-relay-discovery.ts`, `relay-status-loader.ts`, `hooks/use-relay-stats.ts`),
  `getNetwork` (relay-card, about.tsx) and `getSupportedNIPs` (nip66-relay-discovery). Verified
  repo-wide: `getRelayURL`'s only occurrence outside planning docs is its own definition, and
  `getRTT` has no consumers. This follows P4 D-07 ("git history is the record") and **resolves
  the bug Phase 4 deferred here** — `04-11-SUMMARY.md:202` / `04-REVIEW.md` IN-01 record that
  `getRTTTag(stats, _name)` ignores its parameter and always matches `t[1] === "open"`, so
  `getRTT`'s `read`/`write` are silent duplicates of `open`; Phase 4 left it "flagged, not fixed"
  **because this file was a named Phase 5 target**. Deleting the only code it lives in disposes
  of it. Explicitly rejected: fixing and keeping `getRTT` (fixing unverifiable code with zero
  consumers, re-introducing the dead code Phase 4 just swept), and deferring the bug a second
  time.

- **D-14:** `services/verify-event.ts`'s `verifyEvent` is **kept and ignored-with-reason** — it is
  genuinely load-bearing, not a thin wrapper. It indirects over the mutable module-level
  `verifyEventMethod`, which `updateVerifyMethod` swaps at runtime between wasm / internal /
  fake implementations driven by `localSettings.verifyEventMethod`. Inlining it would break the
  strategy swap outright. Two real consumers: `services/event-store.ts:3`,
  `providers/global/napplet-shell-provider.tsx:81`. The `-- reason` must state the late-binding
  requirement, which satisfies D-08's "why couldn't you fix it instead" bar.

### Verification & process

- **D-15:** **Add vitest, scoped to the pure functions this phase creates** — permission/grant
  decisions, identity keying, and the wallet backend factories. CONCERNS.md prescribes exactly
  this ("keep permission storage and grant decisions in pure functions with unit tests"), and the
  D-08 split is what finally makes them testable. **This deliberately overturns P3 D-04**, which
  rejected a test framework as "its own phase"; the justification is that this phase *relocates*
  ~1,750 lines of behavior-bearing, zero-coverage code, where `tsc` proves types but nothing
  proves behavior. Scope discipline matters: this is not a general testing initiative — no tests
  for views, components, or existing untouched code.

  Planning constraints for the addition: the repo pins **vite ^8.1.5** and **typescript ^5.9.3**,
  so the vitest major must match vite 8 (**the researcher must confirm the version — do not
  assume**); pin it exactly per P2 D-14; `pnpm-workspace.yaml` enforces `minimumReleaseAge` with
  an explicit `minimumReleaseAgeExclude` list, so a recent release may need an entry there; and
  P2 D-14's precedent was a **blocking package-legitimacy checkpoint** before install. A `test`
  script must be added to `package.json` (currently there is none) and `.planning/config.json`'s
  `test_command` is presently `pnpm build`.

- **D-16:** **Pure-move commits are separated from behavior-touching edits.** Each relocation
  lands as a move-only commit; any adjustment follows in its own commit. This extends P4 D-04
  ("mechanical churn in its own reviewable commit") from auto-fixes to relocation, and it is what
  lets a reviewer verify a ~1,000-line split mechanically rather than by reading every line.
  Where a move cannot be pure (import paths must change), say so in the commit message.

- **D-17:** **Waves run low-risk first, big splits last.** Wave 1: the mechanical, near-zero-risk
  items (D-06 file-level ignore, D-13 deletions, the D-05 borderline ignores). Wave 2: the small
  extractions (D-07 `useAsyncAction` conversions, magic-textarea, direct-message-form,
  error-logger, notifications, article-reader). Wave 3: the vitest harness (D-15) and the two big
  splits (D-08, D-10). Rationale: the rescan/verification loop is proven before the risky
  relocation, and the harness arrives when there is finally something pure to test. Explicitly
  rejected: risk-first (P3 D-02's ordering — lands the riskiest work before the loop is proven),
  and harness-first (largely infeasible: the functions to test are module-private until extracted).

- **D-18:** **Latent bugs found mid-refactor are fixed if trivial and recorded if not — never
  dropped.** A small, provable fix lands in its own commit (preserving D-16's separation);
  anything larger is promoted to a tracked backlog item **before the phase closes**. This
  addresses the specific failure mode this project has already hit twice: Phase 4's dormant PoW
  path grew into two extra waves, and `getRTTTag` was flagged in a summary and then depended on a
  later phase noticing it (D-13). Explicitly rejected: always-fix-in-place (unpredictable scope),
  and flag-and-defer-by-default (the policy that delivered `getRTTTag` into this phase).

- **D-19:** Verification is a **scoped rescan with a per-rule before/after table (33 → N)** plus
  an explicit list of every site left standing behind an ignore with its reason, following P3 D-04
  / P4 D-14 — now backed by the D-15 test suite. **`pnpm build` must pass after every task**; it
  is the type-check gate and the real backstop for relocation errors.

### Claude's Discretion

- The exact module boundaries and file names within `services/napplet-shell/*` and
  `services/wallets/*`, subject to D-08's and D-10's named seams.
- How `useWebxdc` divides into sub-hooks, and the shape of the `renderBody` / `handleRequest`
  extractions.
- The exact wording of every `-- reason` string, subject to D-08's justification bar.
- Which specific pure functions get vitest coverage under D-15's scope boundary.
- Plan-to-wave assignment within the D-17 ordering.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase source & evidence

- `.planning/ROADMAP.md` — the Phase 5 entry. **Read it knowing it is stale** (D-04): its target
  list, the ">600 lines" figure, and the "thin wrappers to inline or justify" framing are all
  superseded by D-02/D-03/D-13. Correcting it is part of this phase.
- `.planning/research/aislop-scan-2026-09-11.md` §H "Complexity & duplication" — the 32-finding
  baseline this phase was scoped from, and the report format D-19's before/after table follows.
- `.planning/research/aislop-scan-2026-09-11.json` — raw scan; `diagnostics[]` carries
  `filePath`/`line`/`rule`/`severity` (note: the array is `diagnostics`, not `findings`).

### Standard being enforced

- `.aislop/config.yml` — `quality.maxFunctionLoc: 80`, `maxFileLoc: 400`; the bucket-H rules all
  sit at aislop defaults (**all warning severity**).
- `AGENTS.md` §Linting — how the gate works ("no error-severity findings in touched files"), and
  §"Inline ignores" — the rule+reason directive convention D-01/D-05/D-06/D-14 all depend on.
- `AGENTS.md` §"useAsyncAction Hook (REQUIRED)" — the convention D-07 enforces.
- `AGENTS.md` §"Swallowed Exceptions" — the shape any rewritten catch must keep (Phase 3's output).

### Prior-phase decisions that constrain this one

- `.planning/phases/02-adopt-a-lint-config-and-ci-quality-gate/02-CONTEXT.md` — D-11 (file-level
  ignore precedent, behind D-06), D-12 (rule+reason convention), D-14 (exact-pinned devDependency
  + legitimacy checkpoint, behind D-15).
- `.planning/phases/03-audit-swallowed-exceptions-and-silent-failure-paths/03-CONTEXT.md` — D-04
  (rescan-only verification, **which D-15 deliberately overturns**), D-07 (ignores are a last
  resort and must justify why the code could not be fixed), D-09 (`useAsyncAction` default).
- `.planning/phases/04-dead-code-and-import-hygiene-sweep/04-CONTEXT.md` — D-02 (re-measure, don't
  trust written counts), D-04 (mechanical churn in its own commit, behind D-16), D-07 (delete dead
  declarations; git is the record, behind D-13), D-08 (the ignore justification bar).
- `.planning/phases/04-dead-code-and-import-hygiene-sweep/04-11-SUMMARY.md` §202 and
  `04-REVIEW.md` §IN-01 — **the `getRTTTag` bug Phase 4 deferred to this phase** (D-13).
- `.planning/phases/04-dead-code-and-import-hygiene-sweep/04-05-SUMMARY.md` §253 — records the
  `relay-stats.ts` thin-wrapper finding being set aside as out-of-scope.

### Project conventions & known concerns

- `.planning/codebase/CONCERNS.md` — §23–26 prescribes the D-08 napplet split verbatim
  ("Split into `src/services/napplet-shell/*` adapter modules, a small `NappletShellProvider`,
  and separate modal components. Keep permission storage and grant decisions in pure functions
  with unit tests"); also flags wallets (§213–214) and napplet permissions (§88–92) as untested
  and security-sensitive — the basis for D-15.
- `.planning/codebase/CONVENTIONS.md` §"Function Design", §"Module Design" (barrel files are used
  selectively — `services/wallets/index.ts` under D-10 is the `models/index.ts` pattern),
  §"Import Organization" (relative imports preferred; the splits must not rewrite import style).
- `.planning/codebase/ARCHITECTURE.md` §"Architectural Constraints" and §Anti-Patterns — the
  services-vs-providers layer separation behind D-08/D-09, and the top-level-await caveat that
  applies to `services/wallets.ts` and the napplet services.
- `AGENTS.md` §"Project Structure" — where new modules are expected to live.

No external specs or ADRs exist for this phase — requirements are fully captured in the decisions
above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Measured facts (2026-09-24, `next` @ `3e210b641`)

- Repo score **85/100, 694 findings** (baseline was 78/100, 1,196). Bucket H is **33**.
- `napplet-shell-provider.tsx` is **1162 lines** (ROADMAP says ">600"); `wallets.ts` is **591**.
- aislop applies **2× `maxFunctionLoc` to React components** — components are measured against
  160, plain functions and hooks against 80. Both thresholds fire in `napplet-shell-provider.tsx`.

### Reusable assets

- `src/hooks/use-async-action.ts` — catches, toasts `e.message`, logs, and manages `loading`. The
  D-07 target; it replaces the hand-rolled loading state at all three sites.
- `pnpm build` (`tsc --project tsconfig.json && vite build`) — the type-check gate and the real
  backstop for relocation errors (D-19).
- `pnpm exec aislop scan --json .` — produces `.diagnostics[]` for every count in this document.
  Per `AGENTS.md`, `pnpm lint` always exits non-zero — never chain it with `&&`.
- `src/helpers/debug.ts` — `logger.extend(name)`, the established logging pattern for any service
  module the splits create (P3 D-12).
- `services/event-cache/` — the in-repo model for D-10's split: interchangeable backends behind
  one interface, selected at runtime, exposed through `index.ts`.

### Established patterns

- **Directory modules with `index.ts`** (`event-cache`, `database`, `sqlite`, `lookup`,
  `notifications`) imported by bare directory path — this is what makes D-10 zero-churn.
- **Rule-scoped ignores** must name the rule and end with `-- reason` (`AGENTS.md`). In-repo
  instances: `src/sw/client/error-logger.ts` (file-level) and
  `src/hooks/timeline/use-timeline-cache-key.ts` (next-line).
- Components are default exports; internal JSX helpers are PascalCase even when unexported.
- `src/components/napplets/` is the established home for napplet UI (D-09).

### Integration points

- `providers/global/index.tsx:12` imports `NappletShellProvider`; `views/napplets/napplet.tsx:19`
  and `components/napplets/napplet-frame.tsx:33` import `useNappletShell`. These three are the
  entire consumer surface of the 1162-line file.
- `services/wallets.ts` has ~13 import sites across `views/wallet/*`, `views/settings/wallet/*`,
  `hooks/use-wallets.ts`, `components/event-zap-modal/pay-step.tsx` and `wallet-migration.ts` —
  all preserved unchanged by D-10's directory conversion.
- `.aislop/config.yml` — **not to be edited by this phase.** D-01's remedy is inline ignores, not
  threshold tuning; "do not disable rules to pass the scan" (`.claude/AISLOP.md`).
- `.github/workflows/lint.yml` → `pnpm lint:ci`, measured from `git merge-base origin/next HEAD`.
  Touching a legacy file inherits its errors, so any file this phase restructures must leave no
  error-severity finding behind.
- `package.json` — needs a `test` script (D-15); currently has none.

### Constraints found while scouting

- **No test framework exists at all**: no vitest/jest/playwright/cypress/@testing-library in
  `package.json`, **zero test files**, and no test job in any of the five CI workflows. This is
  what D-15 changes, narrowly.
- **Manual UAT has a demonstrated failure mode here**: STATE.md records that Phase 3's
  dev-server verification was killed by OOM with swap exhausted and could not be completed. Do
  not plan verification that depends on a long-running `pnpm dev` session.
- `pnpm-workspace.yaml` enforces `minimumReleaseAge` with an explicit exclude list and an
  `allowBuilds` allowlist — both may need entries for the D-15 dependency.
- The napplet module-level mutable maps (`windowIdentities`, `approvedCapabilities`) and the
  `ALWAYS_ALLOW_STORAGE_KEY` localStorage access are shared across several D-08 split regions and
  must land in exactly one owning module.
- `.planning/config.json` sets `test_command` and `build_command` to `pnpm build`; it has no
  `workflow.ui_safety_gate` key, so **the blocking UI safety gate will fire on waves that touch
  UI** — it was overridden by explicit maintainer decision twice in Phase 4 (STATE.md). This phase
  moves modal components (D-09), so expect it again.

</code_context>

<specifics>
## Specific Ideas

- The phase goal's wording is the bar: the remaining findings must "reflect deliberate
  structure." An ignore whose reason is "out of scope" or "less bad than the others" fails that
  bar — every survivor's reason must explain why the code *could not* be fixed instead (D-08
  lineage from P2 D-12 / P3 D-07 / P4 D-08).
- The ROADMAP's headline target being a false positive (D-06) is the clearest evidence for P4
  D-02's lesson: re-measure before planning, and treat a mismatch as a documentation gap to
  correct (D-04), not a regression to investigate.
- D-16 exists so a reviewer can answer one question mechanically — "did anything change besides
  location?" If a move commit cannot be verified that way, the split was done wrong.
- D-15 is the one place this phase deliberately departs from precedent. The reasoning should be
  recorded in the phase summary, since it reopens a question P3 closed.

</specifics>

<deferred>
## Deferred Ideas

- **Splitting the three oversized page components** — `PollFormInner` (302), `RelayPage` (229),
  `EventPublisherPage` (216). Ignored-with-reason under D-12; revisit if those views ever gain
  test coverage.
- **Consolidating the three sibling napplet services** under `services/napplet-shell/` — no
  findings, pure churn, explicitly excluded by D-11.
- **A general testing initiative** — D-15 is deliberately scoped to the pure functions this phase
  creates. Tests for views, components, and existing untouched code (CONCERNS.md lists WebLN
  balance polling, NWC notifications, NIP-60 unlock, and the napplet sandbox as untested) are a
  separate effort.
- **A shared embed component for `code.tsx` / `youtube.tsx`** — considered and rejected under
  D-05 as coincidental shape; revisit if a third embed type appears.
- **Restructuring `torrentCatagories`** so the duplication genuinely disappears — rejected under
  D-06 as harmful to readability.
- **`react-hooks/exhaustive-deps` (backlog 999.5) and `rules-of-hooks` (999.2)** — will appear in
  files this phase restructures; must not be swept in.
- **Setting `workflow.ui_safety_gate: false` in `.planning/config.json`** — the permanent fix for
  the gate Phase 4 overrode twice. Deliberately left unchanged there; still unaddressed.

</deferred>

---

*Phase: 05-refactor-oversized-files-long-functions-and-duplicated-blocks*
*Context gathered: 2026-09-24*
