---
phase: 04
slug: dead-code-and-import-hygiene-sweep
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-10-01
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: **authored at plan time** — all fourteen PLAN files (04-01 … 04-14) carry a parseable
`<threat_model>` block. 04-01 … 04-11 are the original hygiene sweep; 04-12, 04-13 and 04-14 are
gap-closure plans for the PoW mining defects that UAT found once D-12 made the dormant `MinePOW`
path reachable. Verification depth: ASVS L1 (grep-level mitigation presence), block threshold `high`.

Register merge: the 14 blocks declare 51 distinct IDs (T-04-01 … T-04-51) plus T-04-SC. Seven IDs are
declared by more than one plan and appear below as one row each, citing every declaring plan:
T-04-01 (04-03, 04-04), T-04-02 (04-07, 04-11), T-04-03 (04-01, 04-10), T-04-09 (04-02, 04-03, 04-04,
04-08, 04-10), T-04-17 (04-07, 04-09), T-04-22 (04-05, 04-06), T-04-SC (all 14). Where the declaring
plans rate a shared ID differently (T-04-02: high in 04-07, medium in 04-11) the higher severity is used.

Evidence basis: every check below was run against the current tree (HEAD `1a1013382`), not copied from
a SUMMARY. Phase 05 commits are interleaved after Phase 04's (05-08 refactored `post-modal/index.tsx`,
05-09 split `wallets.ts`, 05-11 moved the napplet-shell code); each mitigation touching those files was
re-checked and survives. Independent measurements this audit: `tsc --noEmit` exit 0 on HEAD; a live
`aislop scan` of HEAD; an `aislop scan` of the exported pre-phase tree (`ded9e38fa`); and a re-run of
04-14's vm-based dev-worker prelude gate (`WORKER_PRELUDE_OK`). Implementation files were not modified.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| automated fixer → working tree | `aislop fix --safe` rewrote ~97 files unattended and ignores the config exclude list (04-01) | Source code integrity, vendored `src/lib/` |
| phase scope → backlog scope | Fixer and edits could reach backlog 999.2 (hook-order), 999.8 (comments), 999.13 (`replyKind` seam) | Source code integrity |
| caught error → handler body | The catch body, not the binding, is what satisfies the swallowed-exception rule (04-02) | Control flow in failure paths |
| lint finding → deletion | The rules flag an unused binding or import, not an unused expression; deleting can remove a live call (04-03, 04-04, 04-10) | Source code integrity |
| function signature → caller | Deleting a positional parameter shifts later arguments; a removed destructured prop flows into `...props` (04-05, 04-06) | Call contracts, DOM attributes |
| ignore directive → future findings | A directive scoped too wide silences defects that do not exist yet (04-07, 04-09) | Lint coverage |
| no-op statement → live call | D-12 turns an inert statement into a call that terminates Web Workers (04-08) | Worker lifecycle |
| finding count → completion claim | A count of zero can be reached by deleting load-bearing code (04-11) | Verification record |
| dormant path → live path | The PoW branch had not run since 2025-06-02; 04-12 made it reachable (04-12) | Signed events, CPU |
| composer → worker pool / relay network | One Web Worker per hardware thread; a signed publish cannot be retracted (04-12, 04-13) | User-key-attributable events (high sensitivity), CPU |
| user dismissal → component lifecycle | ESC, overlay click, route change and ErrorBoundary trips run no in-component teardown (04-13) | Worker lifecycle, pending publish |
| provider failure → caller | `publishEvent` toasts and resolves `undefined` instead of throwing (04-13) | Publish result |
| build config → every emitted bundle | `vite.config.ts` `define` rewrites free identifiers in main-thread chunks, the miner worker and the service worker (04-14) | One value in every JS realm |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-04-01 | Tampering | Dead functions and constants (04-03); deleting a statement whose right-hand side has an effect (04-04) | high | mitigate | Verified: `isDirectReply` (one hit, a commented-out line at `src/services/notifications/threads.ts:203`), `ListFeedButton` and `SUGGESTED_MINTS` have zero live references. Effect-bearing right-hand sides were kept by underscore-prefix: `src/services/outbox-subscriptions.ts:37` (`authors: _authors` rest-exclusion), `src/views/settings/mailboxes/index.tsx:58` (`info: _info` keeps the cached `useRelayInfo` fetch), `src/views/tools/event-console/user-autocomplete.ts:21` (`lookupUsers(...).then(` call kept). `tsc --noEmit` exit 0 on HEAD. Residual the plan accepted: a string-keyed reference evades both `tsc` and the lint rule. | closed |
| T-04-02 | Tampering | File-level `aislop-ignore-file` on `src/services/sqlite/index.ts` (04-07); over-suppressing ignore surviving unchallenged (04-11) | high | mitigate | Verified: `src/services/sqlite/index.ts:1` names exactly `eslint/no-unreachable ai-slop/unreachable-code`, no blanket form. Live HEAD scan shows `ai-slop/trivial-comment` (warning, line 7) still reports on that file, so other rules are not suppressed. Reason corrected by `0bb1e4b1a` (disproven "behavior-change risk" wording removed) and re-read at 04-11; recorded in the Documented Ignores Ledger (`04-VALIDATION.md`). | closed |
| T-04-03 | Tampering | Vendored `src/lib/**` touched by the fixer (04-01) or by a re-run (04-10) | high | mitigate | Verified: `git log ded9e38fa..HEAD -- src/lib/` returns nothing and `git status --short src/lib/` is empty. `138c3f45e` (97 files) excludes it; the two 04-10 commits (`7825bf304`, `8b8627ed2`) are hand edits with no `src/lib/` path. | closed |
| T-04-04 | Tampering | Fixer sweeping backlog-999.8 narrative comments into the hygiene commit (04-01) | medium | mitigate | Verified: none of the six named files (`webxdc.tsx`, `game-controls.tsx`, `signin/connect/index.tsx`, `webxdc-player.tsx`, `pending-unlock.ts`, `wallets.ts`) appear in `138c3f45e`; a diff scan finds 0 changed lines that are not import-shaped; `ai-slop/narrative-comment` is 21 in both the independent pre-phase scan and the HEAD scan. | closed |
| T-04-05 | Repudiation | Catch bodies losing their log or control-flow statement (04-02) | high | mitigate | Verified: diffs of `8ca08e2c2`, `a43b4bee6`, `3b400dbc7` are 24 removed and 24 added lines, every pair `catch (x) {` → `catch {`; no body line touched. HEAD scan: `ai-slop/swallowed-exception` = 0. | closed |
| T-04-06 | Repudiation | Empty or comment-only body becoming a silent failure path (04-02) | medium | mitigate | Verified: no body was edited (above) and HEAD scan `eslint/no-empty` = 0. The one comment-only body (`src/helpers/nostr/zaps.ts`) already scored 0 before the plan and falls through to `return null;` (04-02-SUMMARY). | closed |
| T-04-07 | Denial of Service | PoW miner teardown once `cleanup` is a real call (04-08) | medium | mitigate | Verified: `src/components/pow/mine-pow.tsx:47` `cleanup();` (blame `34e085a60`) sits in `handleMessage`'s `complete` branch, which fires asynchronously after `const cleanup` (line 61) is initialised; `stopMiner()` (line 46) and `cleanup()` terminate different worker sets. Runtime: `04-UAT.md` round 3 test 1 `pass` in a real browser (human-attested) — mining completes, workers torn down. The 04-11 manual row was recorded unverified per Phase 3 precedent, then closed by that UAT. | closed |
| T-04-08 | Repudiation | Deleting the in-catch return instead of the trailing one (04-08) | high | mitigate | Verified: `dfb917453` deletes only the trailing `return false;` in `bip-notation.ts`, `nip-notation.ts` and `goal.ts`; the in-catch `return false;` is present in each diff's context. HEAD scan: `ai-slop/swallowed-exception` = 0, `eslint/no-empty` = 0. | closed |
| T-04-09 | Repudiation | Inherited `react-hooks/rules-of-hooks` errors in touched files (04-02, 04-03, 04-04, 04-08, 04-10) | medium | accept | Accepted as R-04-01. Independent evidence this audit: the exported pre-phase tree reports 48 `react-hooks/rules-of-hooks` errors across 21 files and HEAD reports 48 across the same 21 files with an identical per-file distribution, so they were neither fixed nor suppressed (app-handler-modal 3, messages/group 1, fallback-list-card 1, gallery 1, plus the three 04-10 files). No `aislop-ignore` names the rule. Tracked as backlog 999.2. | closed — accepted (R-04-01) |
| T-04-10 | Tampering | Deleting a live hook invocation with its unused binding (04-03) | high | mitigate | Verified: `src/views/messages/index.tsx:168` `locked` is live (`locked.length` at line 179); only the dead `autoDecryptMessages` `use$` was deleted (the real auto-decrypt path reads `localSettings` directly). The deleted `useEventModel(GiftWrapsModel, ...)` and `useUserMutes(...)` calls are reactive EventStore queries (`src/hooks/use-user-mutes.ts` is a single `useEventModel(MutesQuery, ...)`), with no network side effect. `tsc` exit 0. | closed |
| T-04-11 | Tampering | Deleting a `useState` tuple whose reader half is live (04-03) | medium | mitigate | Verified: `src/views/feeds/dvm/feed.tsx:78` is `const [params] = useState(...)`, reader live at line 83 (`Object.entries(params)`); only the setter slot was elided. `tsc` exit 0. | closed |
| T-04-12 | Tampering | Running the unsafe fix plan, deleting ~950 findings of code unreviewed (04-01) | high | mitigate | Verified: `04-01-PLAN.md:109` states D-04a; 04-01-SUMMARY records only `aislop fix --safe .`; the one resulting commit `138c3f45e` is 97 files, +77/-178, with zero non-import-shaped changed lines, so the unsafe plan's deletions are absent. `.aislop/` has zero commits since the phase base. | closed |
| T-04-13 | Repudiation | Mechanical churn burying a judgment call in one commit (04-01) | medium | mitigate | Verified: the `wallets.ts` merge is its own commit `63b756dc4` (1 file, +1/-2), separate from the mechanical `138c3f45e`. | closed |
| T-04-14 | Tampering | Removing only the declaration of a binding assigned elsewhere (04-04) | medium | mitigate | Verified: `src/components/pow/miner.ts` has 0 `bestHash` references (declaration and reassignment both gone); `user-autocomplete.ts` `lookupPromise` declaration and assignment removed with the call kept (line 21). A surviving orphan assignment would be a `tsc` error; exit 0. | closed |
| T-04-15 | Tampering | Deleting a whole destructuring whose siblings are live (04-04) | medium | mitigate | Verified from `7e7c7c771`: `about.tsx` is now `const { info } = useRelayInfo(relay, true)` (only `loading` dropped) and `src/views/search/components/search-results.tsx:27` is `const { run: searchProfiles } = useAsyncAction(...)` (only `loading: loadingProfiles` dropped). Both live elements and both hook calls retained; `tsc` exit 0. | closed |
| T-04-16 | Tampering | Deleting a framework subscription no type error would catch (04-07) | high | mitigate | Verified: both `formState.isDirty;` reads retained with rule-scoped next-line ignores — `src/views/new/note/short-text-form.tsx:97-98` and `src/components/post-modal/index.tsx:288-289` (survived the Phase 05-08 refactor). The magic-textarea retention expression was later removed as redundant by `0bb1e4b1a`; `Textarea` and `Input` remain referenced as values (`magic-textarea.tsx:199, 214`) and `tsc` exit 0. | closed |
| T-04-17 | Repudiation | An ignore reason that does not meet D-08's why-not-fixed bar (04-07, 04-09) | medium | mitigate | Verified: grep finds zero bare `aislop-ignore` directives in `src/` (every one names its rule and ends `-- reason`); the three Phase 04 directives carry distinct prose; `3fd1aacc8` and `dce715e32` (04-09) add zero ignores; the ledger in `04-VALIDATION.md` was re-read at 04-11. **Limit:** whether prose meets the D-08 bar is a human-judgment standard no rescan can check; this audit verifies shape and distinctness only. | closed |
| T-04-18 | Tampering | Altering the guard while reshaping a short-circuit into an `if` (04-08) | medium | mitigate | Verified from `38e5fe1b2`: `!e.isPropagationStopped() && show();` → `if (!e.isPropagationStopped()) show();`; the condition is identical at `gallery.tsx:23` and `image.tsx:67`. | closed |
| T-04-19 | Tampering | `new Array(n)` replaced, changing sparse to dense semantics (04-09) | medium | mitigate | Verified by reading the consumer: `src/services/napplet-shell/resource-service.ts:45-58` (moved there by Phase 05-11) `mapWithConcurrency` assigns `results[current]` for every index in [0, length) before `return results`, so sparseness is not observable. | closed |
| T-04-20 | Tampering | Length check removed that was guarding a nullish value (04-09) | medium | mitigate | Verified: `src/views/torrents/index.tsx:60` `const tags = tagsParam.value?.split(",") ?? []` is always an array, so `.some` on empty returns false, matching the removed `tags.length > 0 &&` guard. | closed |
| T-04-21 | Tampering | Renaming an exported shadowing binding and breaking importers (04-09) | medium | mitigate | Verified: `src/components/icons/infinity.tsx` renamed `Infinity` → `InfinityIcon`, exported only as `export default`; the module has zero importers in `src/`; `tsc` exit 0. | closed |
| T-04-22 | Tampering | Deleting a contract-bound parameter and shifting later positional arguments (04-05, 04-06) | high | mitigate | Verified from `7a5e2faa0`, `30f0ff230`, `6e5131097`, `3b2aeff0e`: handlers, callbacks and interface members were prefixed only (`removeSlide(_ref ...)`, `.catch(() =>`, `([_relay, mode])`, `upgrade(..., _event)`). The only outright deletions are trailing or optional items (`useDnsIdentity` `force`, `useUserPinList` `force`, props `noOpenGraphLinks`, `hideDrawerButton`, `noProxy`, `to`) — no mid-signature deletion. No 2-argument `useDnsIdentity` or 3-argument `useUserPinList` caller remains; `tsc` exit 0; HEAD scan `eslint/no-unused-vars` Parameter findings = 0. | closed |
| T-04-23 | Tampering | Dropping `node` from a markdown destructuring so it reaches the DOM (04-05) | medium | mitigate | Verified: `src/components/markdown/markdown.tsx` has 10 `node: _node` renames beside `...props` (lines 42-130); none dropped. | closed |
| T-04-24 | Tampering | Diverging remedies for a parameter shared by two components (04-05) | medium | mitigate | Verified: `7a5e2faa0` removed `hideDrawerButton` from both `timeline/highlight.tsx` and `timeline/note/index.tsx` in one commit; zero references remain in `src/`. | closed |
| T-04-25 | Repudiation | Deleting `replyKind` and destroying backlog 999.13's write-seam (04-06) | high | mitigate | Verified: `src/views/thread/components/reply-form.tsx:25` `replyKind?: number;` and `:30` `replyKind: _replyKind = kinds.ShortTextNote` both present; `grep -c replyKind` = 2 (criterion ≥ 2) and `grep -c ShortTextNote` = 1 (criterion = 1). | closed |
| T-04-26 | Tampering | Removing a prop from an exported props type as if it were hygiene (04-06) | medium | mitigate | Verified: the two props removed in 04-06 (`noProxy` on `DVMAvatar`, `to` on `RelayCard`) have no caller passing them; the others stayed via `_` prefix (`showUsers`, `relay`, `rootId`, `text`, `group`). `tsc` exit 0. | closed |
| T-04-27 | Tampering | Deleting an import that is actually referenced (04-10) | medium | mitigate | Verified: `tsc --noEmit` exit 0 on HEAD; `8b8627ed2` and `7825bf304` changed lines are import-shaped apart from blank lines and one orphaned local helper whose removal `tsc` covers; HEAD scan `ai-slop/unused-import` = 0. | closed |
| T-04-28 | Tampering | Losing type-only semantics when merging into a value import (04-10) | medium | mitigate | Verified: `7825bf304` merges only value-position specifiers and drops no `type` specifier; `tsconfig.json` sets `isolatedModules: true` and `tsc` exit 0; the 04-01 `wallets.ts` merge keeps the inline `type EncryptedContentCache`. | closed |
| T-04-29 | Tampering | Import grouping drifting from CONVENTIONS.md (04-10) | medium | mitigate | Verified: the `7825bf304` diff (4 files, +14/-7) collapses each duplicate into the earlier occurrence; in `app-tabs-layout.tsx` the merged chakra import holds the first position and the relative order of the react and react-router imports and the blank-line grouping are unchanged. | closed |
| T-04-30 | Repudiation | Declaring the phase complete on a count rather than on triage (04-11) | high | mitigate | Verified independently: bucket-C is 417 in the exported pre-phase scan and 0 at HEAD; `ai-slop/swallowed-exception` 0 in both; the before/after table and Documented Ignores Ledger in `04-VALIDATION.md` / `04-11-SUMMARY.md` reconcile. Surviving Phase 04 ignores are three, each ledgered (see T-04-17). | closed |
| T-04-31 | Repudiation | Inherited hook-order errors misread as Phase 4 regressions, or a real regression waved through (04-11) | high | mitigate | Verified independently: the only error-severity rule is `react-hooks/rules-of-hooks` at both the pre-phase tree (48) and HEAD (48), same per-file distribution. 04-11-SUMMARY records `git diff` evidence at merge-base `77032fc00f8` for each of the 19 `lint:ci` errors. | closed |
| T-04-32 | Repudiation | A manual-only verification silently dropped (04-11) | medium | mitigate | Verified: the PoW spot-check was recorded "Outstanding / unverified" (04-11-SUMMARY:198, 04-VALIDATION.md Manual-Only table), not dropped, then resolved by UAT round 3. | closed |
| T-04-33 | Repudiation | D-12 at `mine-pow.tsx:47` reverted by an executor re-diagnosing (04-12) | high | mitigate | Verified: `cleanup();` ×1 and `stopMiner();` ×1 in `mine-pow.tsx`; blame on line 47 is `34e085a60` (04-08), untouched by 04-12, 04-13 and 04-14; the 04-12 mine-pow commit `8a4d2af4c` is a single-line change (`>` → `>=`). | closed |
| T-04-34 | Tampering | `createDraft` invoked twice per submit (04-12) | medium | mitigate | Verified: `await createDraft(values)` count is 1 in `short-text-form.tsx:153` and 1 in `post-modal/index.tsx:336`. | closed |
| T-04-35 | Tampering | Weakening the render gate instead of populating it (04-12) | high | mitigate | Verified: `miningTarget && draft` count is 1 in `short-text-form.tsx:180` and 1 in `post-modal/index.tsx:346` (preserved through the Phase 05-08 refactor). | closed |
| T-04-36 | Denial of Service | Worker pool now actually spawns, one per hardware thread (04-12) | medium | accept | Accepted as R-04-02. Rationale claims verified: Cancel (`mine-pow.tsx:148`) and Skip (`:157`) call `stopMiner.current()`, completion calls `cleanup()` (`:47`), and 04-13 added unmount teardown. Human-observed: `04-UAT.md` round 3 tests 1 and 3 `pass`. | closed — accepted (R-04-02) |
| T-04-37 | Information Disclosure | Draft finalized even when the user cancels mining (04-12) | low | accept | Accepted as R-04-03. Rationale claim verified: `useFinalizeDraft` (`src/providers/global/publish-provider.tsx:124`) only applies the client tag and sets `pubkey`; the sole `signEvent` call is in `publishEvent` (line 154), reached only through `publishPost`. | closed — accepted (R-04-03) |
| T-04-38 | Repudiation | Claiming end-to-end mining is verified when only static checks ran (04-12) | high | mitigate | Verified: `04-12-SUMMARY.md` "Unverified Items (human-only)" (lines 150-156) states no automated gate proves the render gate opens and routes the claim to UAT; `04-UAT.md` round 3 then supplies human evidence (tests 1 and 2 `pass`). | closed |
| T-04-39 | Repudiation | Pending publish timer firing after the user dismissed (04-13, CR-03) | critical | mitigate | Verified: `mine-pow.tsx:103` `pendingPublish` ref; `:116` the file's only `setTimeout(` is assigned to `pendingPublish.current`; `:126` `clearTimeout(pendingPublish.current)` inside `useUnmount` (`:123-128`). Signing exists only in `publishEvent` (`publish-provider.tsx:154`), so a cancelled timer means no signature. Runtime: `04-UAT.md` round 3 test 3 `pass` (human-attested; the post-"Found POW" window is confirmed exercised by the orchestrator's UAT summary, not itemised in the file). | closed |
| T-04-40 | Denial of Service | Worker pool leaked on any non-Cancel/Skip unmount (04-13, CR-02) | high | mitigate | Verified: `stopMiner.current();` appears 3 times (Cancel `:148`, Skip `:157`, unmount `:127`); `useUnmount` imported and called (count 2). Runtime: `04-UAT.md` round 3 test 3 `pass` (no surviving Worker threads). | closed |
| T-04-41 | Denial of Service | Mining gate left open after a failed publish, remounting `MinePOW` forever (04-13, CR-01) | high | mitigate | Verified: `short-text-form.tsx` has `setMiningTarget(0)` twice (`:147` publish-failure reset, `:186` cancel); `publishEvent` toasts and resolves `undefined` on failure (`publish-provider.tsx` catch, `quite` defaults true) so the falsy `pub` triggers the reset; `setLoading("")` at `:141` and in `submit`'s `finally` (`:157`). Runtime: `04-UAT.md` round 3 test 4 `pass` (no re-mine). | closed |
| T-04-42 | Repudiation | D-12 at `mine-pow.tsx:46-47` reverted while 04-13 edits the same file (04-13) | high | mitigate | Verified: same gates as T-04-33 after both 04-13 mine-pow commits (`f4fa32c8c`, `cd22f3579`); `cleanup();` ×1, `stopMiner();` ×1; blame on line 47 unchanged. | closed |
| T-04-43 | Tampering | Adopting WR-02's `complete`-flag remedy, deleting 04-12's `>=` (04-13) | high | mitigate | Verified: `mine-pow.tsx:132` `bestProgress.difficulty >= targetPOW ?` (blame `8a4d2af4c`, 04-12); no `complete`/`isComplete` state exists in the file. | closed |
| T-04-44 | Information Disclosure | Cached draft removed on navigate-away during a mine (04-13, WR-03) | medium | accept | Accepted as R-04-04. Verified: `src/hooks/use-cache-form.ts` has zero commits since the phase base and its teardown still removes on `isSubmitted`; deferral recorded in `04-13-SUMMARY.md:144` and `04-VERIFICATION.md` Known Latent items. | closed — accepted (R-04-04) |
| T-04-45 | Repudiation | 04-13's own verification claims (04-13) | high | mitigate | Verified: `04-13-SUMMARY.md` "Human-Only Verification — Outstanding, Routed to Follow-up UAT" (lines 160-176) lists eight `unverified` items, none recorded as covered; UAT rounds 2 and 3 then ran them. | closed |
| T-04-46 | Denial of Service | Dev PoW worker pool: every miner worker throws at load (04-14) | high | mitigate | Verified: `vite.config.ts:45` `global: "globalThis"`. Re-ran the plan's gate this audit: Vite's real `vite:client-inject` transform emits `const defines = {"global": globalThis};` and evaluating it in a window-less `node:vm` context prints `WORKER_PRELUDE_OK`. Runtime: `04-UAT.md` round 3 test 2 `pass` in a browser, workers mine and mining completes. | closed |
| T-04-47 | Tampering | Build-time `global` rewrite in main-thread chunks and `dist/sw.js` (04-14) | high | mitigate | Verified: `dist/sw.js` (built 12:33, after fix commit `73668e40e` at 12:30) has 0 bare `typeof global !== "undefined"` guards and 1 Capacitor fallback chain ending `typeof globalThis !== "undefined" ? globalThis : {}`; the `define` is retained so 74ece28df's rewrite is preserved. | closed |
| T-04-48 | Tampering | Production miner bundle must stay self-contained (04-14) | medium | mitigate | Verified: exactly one `dist/assets/miner-CpFg6wop.js`, 0 `@vite/env` references; `src/components/pow/miner.ts` imports only `nostr-tools`. | closed |
| T-04-49 | Repudiation | D-12 / 04-12 / 04-13 PoW code touched by an unrelated build fix (04-14) | high | mitigate | Verified: `git log a42dbdcf4..HEAD -- src/components/pow src/views/new/note/short-text-form.tsx src/components/post-modal/index.tsx` is empty; the four 04-14 commits touched only `vite.config.ts`, `src/polyfill.ts`, the debug session and the SUMMARY; `cleanup();` and `stopMiner();` still appear once each. | closed |
| T-04-50 | Repudiation | 04-14's own verification claims (04-14) | high | mitigate | Verified: `04-14-SUMMARY.md` "Verification evidence (static only)" and "Runtime confirmation required (UAT re-run)" route tests 1-4 to a human; no 04-14 commit touches `04-UAT.md` (0 of 4); the `resolved` status on the debug sessions and UAT gaps was set only by the later human-driven commit `1a1013382`. | closed |
| T-04-51 | Information Disclosure | `globalThis.global` alias exposed by the polyfill (04-14) | low | accept | Accepted as R-04-05. Verified: `src/polyfill.ts:4` is `globalThis.global \|\|= globalThis;`, aliasing the global object onto itself with no new data reachable. | closed — accepted (R-04-05) |
| T-04-SC | Tampering | npm/pnpm installs (all 14 plans) | low | accept | Accepted as R-04-06. Verified: across the 95 Phase 04 commits, no `package.json`, `pnpm-lock.yaml` or `.aislop/` file was touched; the only file outside `src/` and `.planning/` is `vite.config.ts` (04-14). | closed — accepted (R-04-06) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (`high`) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

All 52 threats resolve to `closed`: 46 mitigated and verified in code or git history, 6 accepted and
logged below, none transferred. No threat is open at any severity. By severity the register holds 1
`critical` (T-04-39), 24 `high`, 24 `medium` and 3 `low` threats; the critical and all 24 high are
mitigated and verified, and the only accepted threats are medium or low.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-04-01 | T-04-09 | Inherited `react-hooks/rules-of-hooks` errors in touched files are backlog 999.2 / D-15, deliberately neither fixed nor suppressed. Audit confirmed the pre-phase and HEAD per-file distribution is identical (48 across 21 files). | hzrd149 (04-02, 04-03, 04-04, 04-08, 04-10 PLAN) | 2026-09-15 |
| R-04-02 | T-04-36 | Opening the PoW gate spawns `getNumThreads()` workers per mining run. Cancel, Skip, completion and (since 04-13) unmount all tear them down. The identical-nonce-sequence inefficiency is a documented follow-up, not new exposure. | hzrd149 (04-12-PLAN.md) | 2026-09-16 |
| R-04-03 | T-04-37 | `finalizeDraft` now runs before the user can cancel, but it only adds the client tag and pubkey to local component state; nothing is signed or published without an explicit `publishPost`. | hzrd149 (04-12-PLAN.md) | 2026-09-16 |
| R-04-04 | T-04-44 | `useCacheForm` flips `isSubmitted` at mining start, so the cached draft is removed if the user navigates away mid-mine. Partially mitigated by 04-13's CR-01 fix; the long-mine window is deferred as WR-03 because a fix touches 8 consumer forms. | hzrd149 (04-13-PLAN.md) | 2026-09-17 |
| R-04-05 | T-04-51 | `globalThis.global \|\|= globalThis` aliases the global object onto itself, as the code did before; no new data becomes reachable. | hzrd149 (04-14-PLAN.md) | 2026-10-01 |
| R-04-06 | T-04-SC | No package installed, removed or upgraded by any Phase 04 plan; dependency manifests and `.aislop/` untouched. | hzrd149 (04-01 … 04-14 PLAN) | 2026-09-15 |

*Accepted risks do not resurface in future audit runs.*

---

## Residual Items (non-blocking)

None of these is an open threat. They are verification-quality notes and tracked follow-ups, all below
the `high` block threshold or outside the register.

| Ref | Note | Tracked in |
|-----|------|------------|
| T-04-07, T-04-36, T-04-39, T-04-40, T-04-41, T-04-46 | Runtime evidence for these is human-attested: `04-UAT.md` round 3 records tests 1-4 re-run and passing in a browser (commit `1a1013382`) with result lines only, no per-test round-3 notes. This audit independently verified the code, the build artifacts and the vm prelude gate, but did not run a browser. The post-"Found POW" dismissal window is confirmed by the orchestrator's UAT summary rather than itemised in the file. | `04-UAT.md` |
| T-04-17 | Whether an ignore reason meets D-08's why-not-fixed bar is a prose judgment; this audit verified directive shape, rule-scoping and distinctness, and relied on the 04-11 re-read for adequacy. | `04-VALIDATION.md` Manual-Only table |
| T-04-01 | A string-keyed or dynamic reference to a deleted symbol would evade `tsc` and the lint rule alike; the plan accepted this as residual. | `04-03-PLAN.md` T-04-01 |
| T-04-46 | `04-REVIEW-14.md` WR-01: no committed regression test guards the rule that a `define` value must evaluate in every JS realm, so re-adding a window-only value would re-break dev workers with no test failing. Durability warning, not a current gap. | `04-REVIEW-14.md`, `04-VERIFICATION.md` |
| Record drift | `04-VERIFICATION.md` (status `human_needed`, 5 `behavior_unverified` items) and the PoW rows in `04-VALIDATION.md` (D-12 row "flaky", Manual-Only PoW row "Outstanding / unverified") predate UAT round 3 and still read unverified. This is stale documentation, not a security gap; the orchestrator may want to refresh them. | `04-VERIFICATION.md`, `04-VALIDATION.md` |

Unregistered threat flags: none. Only `04-14-SUMMARY.md` has a `## Threat Flags` section and it reads
"None. No new network, auth or file-access surface." No other SUMMARY carries one. No new dependency,
network call, parser or stored data was introduced by any of the 14 plans.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-01 | 52 | 52 | 0 | /gsd-secure-phase (ASVS L1, block_on: high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-01
