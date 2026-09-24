# Phase 5 — Measured Baseline (D-03 re-measurement)

**Measured at commit:** `ac904e754` (branch `next`)
**Date:** 2026-09-24
**Command:** `pnpm exec aislop scan --json . > /tmp/aislop-05-baseline.json` (`.diagnostics[]`, not `.findings[]`)

## Header facts

| Fact | Value |
|---|---|
| Repo score | **85/100** |
| Total diagnostic count (whole repo) | **694** |
| Bucket-H total (the four rules below) | **33** |

Per D-03, these measured values are authoritative over any number written in `ROADMAP.md` or
`05-CONTEXT.md`. The live scan matches the score and total-diagnostic figures already recorded in
`05-CONTEXT.md` (85/100, 694) exactly — no discrepancy note is needed for those two numbers. The
per-rule breakdown below also matches `05-CONTEXT.md`'s table exactly (21/8/2/2, summing to 33),
including the `function-too-long` 7→8 drift already called out there relative to the stale
2026-09-11 baseline (78/100, 1,196, bucket H = 32).

## Per-rule before/after table (D-19)

This is the table every later plan (05-02 through 05-13) appends its after-count to; 05-14 closes
it.

| Rule | Before | After | Delta |
|---|---|---|---|
| `code-quality/duplicate-block` | 21 | 0 (05-02, 05-03, 05-04, 05-05, 05-06) | -21 |
| `complexity/function-too-long` | 8 | 4 (05-03, 05-07) | -4 |
| `complexity/file-too-large` | 2 | TBD | TBD |
| `ai-slop/thin-wrapper` | 2 | 0 (05-02) | -2 |
| **Total** | **33** | **6 so far (05-02, 05-03, 05-04, 05-05, 05-06, 05-07)** | **-27 so far** |

## Per-finding table (D-01 / D-02)

Every one of the 33 findings carries a real disposition — `extract`, `convert`, `delete`, or
`ignore-with-reason` — taken from the `05-CONTEXT.md` verdicts (D-05, D-06, D-07, D-08, D-12,
D-13, D-14). None are marked "out of scope" (D-01). The `Plan` column is the current best mapping
onto `ROADMAP.md`'s Phase 5 wave/plan list; exact module boundaries within the D-08/D-10 splits
remain Claude's discretion per `05-CONTEXT.md`, so a few rows spanning multiple waves are marked
with a range.

| Rule | File:Line | Detail | Disposition | Decision | Plan |
|---|---|---|---|---|---|
| `ai-slop/thin-wrapper` | `src/helpers/nostr/relay-stats.ts:7` | Function `getRelayURL` is a thin wrapper that only calls another function | delete | D-13 — half-dead; `getRelayURL`, `getRTT`, `getRTTTag`, `MONITOR_METADATA_KIND` deleted, resolving the Phase 4-deferred `getRTTTag` bug | 05-02 |
| `ai-slop/thin-wrapper` | `src/services/verify-event.ts:32` | Function `verifyEvent` is a thin wrapper that only calls another function | ignore-with-reason | D-14 — load-bearing indirection over the runtime-swapped `verifyEventMethod` | 05-02 |
| `code-quality/duplicate-block` | `src/components/content/links/code.tsx:40` | 11 lines duplicate block at L15 | ignore-with-reason | D-05 — coincidental shape vs. `youtube.tsx` (different hosts/aspect ratios/iframe props) | 05-03 |
| `code-quality/duplicate-block` | `src/components/content/links/youtube.tsx:58` | 14 lines duplicate block at L25 | ignore-with-reason | D-05 — coincidental shape vs. `code.tsx` | 05-03 |
| `code-quality/duplicate-block` | `src/components/magic-textarea.tsx:202` | 12 lines duplicate block at L179 | extract | D-05 — clear win, `MagicInput`/`MagicTextArea` twin `forwardRef` components | 05-05 |
| `code-quality/duplicate-block` | `src/helpers/nostr/torrents.ts:119` | 11 lines duplicate block at L86 | ignore-with-reason | D-06 — one file-level ignore covers all 5 `torrentCatagories` leaves | 05-02 |
| `code-quality/duplicate-block` | `src/helpers/nostr/torrents.ts:121` | 11 lines duplicate block at L110 | ignore-with-reason | D-06 | 05-02 |
| `code-quality/duplicate-block` | `src/helpers/nostr/torrents.ts:131` | 19 lines duplicate block at L118 | ignore-with-reason | D-06 | 05-02 |
| `code-quality/duplicate-block` | `src/helpers/nostr/torrents.ts:150` | 10 lines duplicate block at L87 | ignore-with-reason | D-06 | 05-02 |
| `code-quality/duplicate-block` | `src/helpers/nostr/torrents.ts:152` | 10 lines duplicate block at L111 | ignore-with-reason | D-06 | 05-02 |
| `code-quality/duplicate-block` | `src/services/notifications/common.ts:91` | 11 lines duplicate block at L61 | extract | D-05 — clear win, shared `createTimelineLoader` options object | 05-06 |
| `code-quality/duplicate-block` | `src/services/notifications/common.ts:118` | 12 lines duplicate block at L60 | extract | D-05 | 05-06 |
| `code-quality/duplicate-block` | `src/sw/client/error-logger.ts:56` | 12 lines duplicate block at L34 | extract | D-05 — clear win, shared `console.group` rendering loop | 05-06 |
| `code-quality/duplicate-block` | `src/views/articles/components/article-reader.tsx:286` | 11 lines duplicate block at L269 | extract | D-05 — clear win, three identical Slider `FormControl`s | 05-05 |
| `code-quality/duplicate-block` | `src/views/articles/components/article-reader.tsx:304` | 10 lines duplicate block at L270 | extract | D-05 | 05-05 |
| `code-quality/duplicate-block` | `src/views/groups/index.tsx:184` | 14 lines duplicate block at L99 | ignore-with-reason | D-05 — coincidental, `SimpleGrid` ternary chain | 05-03 |
| `code-quality/duplicate-block` | `src/views/lists/components/list-history-modal.tsx:279` | 12 lines duplicate block at L197 | ignore-with-reason | D-05 — coincidental, row-variant badge/`ButtonGroup` tails | 05-03 |
| `code-quality/duplicate-block` | `src/views/messages/chat/components/direct-message-form.tsx:240` | 13 lines duplicate block at L171 | extract | D-05 — clear win, twin inbox-list blocks (self vs. other pubkey) | 05-06 |
| `code-quality/duplicate-block` | `src/views/notifications/index.tsx:77` | 11 lines duplicate block at L57 | extract | D-05 — clear win, repeated metadata badge block | 05-05 |
| `code-quality/duplicate-block` | `src/views/notifications/index.tsx:98` | 10 lines duplicate block at L58 | extract | D-05 | 05-05 |
| `code-quality/duplicate-block` | `src/views/settings/background-worker/cached-files-card.tsx:95` | 18 lines duplicate block at L70 | convert | D-07 — `useAsyncAction` conversion; duplication clears as a side effect, verified by rescan | 05-04 |
| `code-quality/duplicate-block` | `src/views/settings/background-worker/cached-files-card.tsx:122` | 14 lines duplicate block at L71 | convert | D-07 | 05-04 |
| `code-quality/duplicate-block` | `src/views/settings/background-worker/service-worker-status-card.tsx:97` | 10 lines duplicate block at L69 | convert | D-07 | 05-04 |
| `complexity/file-too-large` | `src/providers/global/napplet-shell-provider.tsx:0` | 1163 lines (threshold 400; 2× not applicable to file size) | extract | D-08 — full split into `services/napplet-shell/*` adapters + thinned provider + modals moved out (D-09) | 05-10–05-12 |
| `complexity/file-too-large` | `src/services/wallets.ts:0` | 592 lines (threshold 400) | extract | D-10 — directory split by backend (`services/wallets/{types,webln,nwc,nutwallet,index}.ts`), zero-churn for ~13 import sites | 05-09 |
| `complexity/function-too-long` | `src/components/post-modal/index.tsx:160` | `renderBody` · 123 lines (over 80 by 66 measured in `05-CONTEXT.md`; live scan reports 123, same finding) | extract | D-12 — non-component extraction | 05-08 |
| `complexity/function-too-long` | `src/components/webxdc/webxdc.tsx:138` | `handleRequest` · 102 lines | extract | D-12 — non-component extraction | 05-08 |
| `complexity/function-too-long` | `src/hooks/use-webxdc.ts:22` | `useWebxdc` · 234 lines | extract | D-12 — divides into sub-hooks along its natural seams | 05-07 |
| `complexity/function-too-long` | `src/providers/global/napplet-shell-provider.tsx:610` | `createResourceService` · 162 lines | extract | D-12 / D-08 — resolved by the D-08 split (resource-service region), not separately | 05-11 |
| `complexity/function-too-long` | `src/providers/global/napplet-shell-provider.tsx:962` | `NappletShellProvider` · 195 lines | extract | D-12 / D-08 — resolved by the D-08 split (thinned provider component), not separately | 05-12 |
| `complexity/function-too-long` | `src/views/new/poll/poll-form.tsx:72` | `PollFormInner` · 302 lines | ignore-with-reason | D-12 — page component over the 160-line component budget; inherent JSX composition, no test coverage, splitting risks silent regression | 05-03 |
| `complexity/function-too-long` | `src/views/relays/relay/tabs/about.tsx:47` | `RelayPage` · 229 lines | ignore-with-reason | D-12 | 05-03 |
| `complexity/function-too-long` | `src/views/tools/event-publisher/index.tsx:40` | `EventPublisherPage` · 216 lines | ignore-with-reason | D-12 | 05-03 |

Row count check: `ai-slop/thin-wrapper` 2, `code-quality/duplicate-block` 21,
`complexity/file-too-large` 2, `complexity/function-too-long` 8 — sums to 33, matching the
per-rule before-table exactly.

## 05-03 surviving-ignore rows

Live rescan after 05-03 confirms the measured after-counts match the plan's prediction exactly:
`code-quality/duplicate-block` 16 → 12 (-4), `complexity/function-too-long` 8 → 5 (-3), bucket-H
total 26 → 19. The seven findings below are the plan's deliberate survivors — each carries a
rule-scoped `aislop-ignore-*` directive naming its rule and ending with `-- reason`, per
`AGENTS.md` "Inline ignores". No executable code changed in any of the seven files.

| Rule | File:Line | Directive scope | Reason (as written in the file) |
|---|---|---|---|
| `code-quality/duplicate-block` | `src/components/content/links/code.tsx:40` | file-level | renderCodePenURL and renderArchiveOrgURL both wrap ExpandableEmbed, but with different hosts, iframe sizing, and path matching; a shared abstraction would need more configuration parameters than the duplicated lines it would remove (D-05, revisit only if a third embed type appears) |
| `code-quality/duplicate-block` | `src/components/content/links/youtube.tsx:58` | file-level | YoutubePlaylistEmbed and YoutubeVideoEmbed both wrap ExpandableEmbed, but differ in aspect ratio, embed URL construction, and permitted iframe features; a shared abstraction would need more configuration parameters than the duplicated lines it would remove (D-05, revisit only if a third embed type appears) |
| `code-quality/duplicate-block` | `src/views/groups/index.tsx:184` | file-level | the SimpleGrid in FriendsGroups and the SimpleGrid in YourGroups are separate arms of an unrelated ternary chain rendering the same grid container over different data sources, each with its own loading and empty state; merging them would tie two independently-evolving branches behind a flag (D-05) |
| `code-quality/duplicate-block` | `src/views/lists/components/list-history-modal.tsx:279` | file-level | the trailing badge/ButtonGroup in HiddenVersionRow matches the same tail in VersionRow because the two are sibling row variants, not because they share behaviour; HiddenVersionRow additionally renders an Unlock control that VersionRow has no equivalent for (D-05) |
| `complexity/function-too-long` | `src/views/new/poll/poll-form.tsx:72` | next-line | PollFormInner is a single flat poll-creation form tree with no repeated sub-structure worth extracting, and this view has no test coverage, so splitting it risks a silent regression nothing in the project would catch (D-12) |
| `complexity/function-too-long` | `src/views/relays/relay/tabs/about.tsx:47` | next-line | RelayPage is a single flat relay-detail page tree with no repeated sub-structure worth extracting, and this view has no test coverage, so splitting it risks a silent regression nothing in the project would catch (D-12) |
| `complexity/function-too-long` | `src/views/tools/event-publisher/index.tsx:40` | next-line | EventPublisherPage is a single flat event-publishing page tree with no repeated sub-structure worth extracting, and this view has no test coverage, so splitting it risks a silent regression nothing in the project would catch (D-12) |

## 05-04 D-07 resolution (measured, not assumed)

Live rescan after 05-04 confirms the plan's predicted outcome exactly: `code-quality/duplicate-block`
12 → 9 (-3), bucket-H total 19 → 16. This is the plan's "expected outcome" branch — the third
`code-quality/duplicate-block` finding also cleared, without needing a follow-up conversion of
`applyUpdate` or a shared-toast extraction:

- `src/views/settings/background-worker/cached-files-card.tsx` — all three flagged handlers
  (single-cache clear, clear-all, refresh) converted to `useAsyncAction`. Rescan immediately after
  Task 1 confirmed both duplicate-block findings in this file (lines 95 and 122 in the pre-05-04
  baseline) cleared to 0. Per-row loading feedback preserved via a name-valued `isClearingCache`
  state set/cleared around the single-cache handler's callback; the load handler (lines 44-61) was
  confirmed untouched by `git diff`.
- `src/views/settings/background-worker/service-worker-status-card.tsx` — only the update-check
  handler (`checkForUpdate`) was converted. Rescan immediately after Task 2 confirmed the file's
  one duplicate-block finding (line 97 in the pre-05-04 baseline) cleared to 0 without touching
  `applyUpdate`, resolving RESEARCH.md's Pitfall 1 ambiguity in favor of the update-check handler
  being the actual anchor. `applyUpdate` remains unconverted; it was not flagged and converting it
  would have been scope creep.

No ignore directive was added in either file (`grep -ric 'out of scope'` returns 0 across both);
the conversion alone resolved all three findings, so neither the shared-toast-helper extraction nor
a rule-scoped ignore fallback described in the plan was needed.

## 05-05 D-05 clear-win extraction resolution (measured, not assumed)

Live rescan after 05-05 confirms the plan's predicted outcome exactly: `code-quality/duplicate-block`
9 → 4 (-5), bucket-H total 16 → 11. All five findings targeted by this plan cleared; the 4 findings
remaining after this plan are all in files owned by plan 05-06 (`services/notifications/common.ts` x2,
`sw/client/error-logger.ts`, `views/messages/chat/components/direct-message-form.tsx`), confirmed via
the full-repo `--json` rescan's per-finding `filePath` field, not assumed.

- `src/components/magic-textarea.tsx` — the `MagicInput`/`MagicTextArea` twin `forwardRef`
  components now share one internal `createAutocompleteProps()` factory taking the rendered
  element, the default aria-label, the triggers, the ref, and the aria-label override; each
  component keeps its own `forwardRef` wrapper, generic type parameters and ref-bridging
  expression. The default/named export statement, the textarea-only `displayName` assignment,
  and both `@ts-expect-error`/`@ts-ignore` suppression comments are byte-identical to before
  (confirmed via `git diff` — no hunk touches the final export line, suppression count stays at
  3). File grew from 217 to 222 lines (+5) rather than shrinking, because the factory's own
  TypeScript generic signature and 8-property return object cost more lines than the 16 lines of
  duplicated JSX props they replace — a measured discrepancy against the plan's "file is shorter"
  prediction, recorded here rather than silently assumed; the finding itself is confirmed cleared
  by the scoped rescan regardless.
- `src/views/articles/components/article-reader.tsx` — a new internal `VoiceSlider` component
  (with a co-located `VoiceSliderProps` type alias, unexported) backs all three sliders (speed,
  pitch, volume); each call site still formats its own label (`x{n.toFixed(1)}` for speed/pitch,
  `{Math.round(n * 100)}%` for volume) and passes it as a rendered node. File shrank from 331 to
  329 lines, confirming the duplication was actually removed. No new file created under
  `src/views/articles/components/`.
- `src/views/notifications/index.tsx` — a new internal `NotificationCountBadge` component backs
  the `metadata` prop on all six `SimpleNavBox` boxes (replies, mentions, threads, quotes,
  reposts, zaps), not just the two flagged by the scan — the rule reports one finding per matched
  pair, so all six call sites needed conversion for the finding to clear, per the plan's explicit
  warning. The zero-count `return null` and the all-time label omission are preserved exactly as
  written, including the pre-existing `count > 0 ? "primary" : "gray"` ternary (always `"primary"`
  post-guard, left unsimplified per the plan's instruction). File shrank from 171 to 131 lines
  (-40, the largest reduction of the three). No new file created under `src/views/notifications/`.

No consumer of any of the three files' default/named exports required editing; `pnpm build`
(typecheck + bundle) passed after every task.

## 05-06 D-05 clear-win extraction resolution (measured, not assumed)

Live rescan after 05-06 confirms the plan's predicted 4-row reduction exactly: `code-quality/duplicate-block`
4 → 0 (-4), bucket-H total 11 → 7. All four findings targeted by this plan (both in
`services/notifications/common.ts`, one in `sw/client/error-logger.ts`, one in
`views/messages/chat/components/direct-message-form.tsx`) cleared, confirmed via the full-repo
`--json` rescan's per-finding `filePath` field after each task, not assumed. `code-quality/duplicate-block`
now stands at 0 whole-repo — every finding in this rule that existed at the 33-row baseline has
been either extracted or ignored-with-reason.

- `src/sw/client/error-logger.ts` — the two error-log printers now share one internal
  `renderErrorLogGroup(logs, groupLabel, entryLabel)` helper that performs the `console.group`
  rendering loop; each printer keeps its own distinct empty-list message and calls the helper
  with its own group label and per-entry label builder (the first printer's label embeds the
  log's context, the second's does not, since it already scopes the whole group to one context).
  The file-level `aislop-ignore-file ai-slop/console-leftover` directive on line 1 is confirmed
  byte-identical via `git diff` (0 hunks touch line 1). Export count unchanged (6 exported
  members, not 5 as the plan's read_first note stated — a plan-documentation discrepancy, not a
  code issue; the acceptance criterion "export count unchanged from before the edit" is satisfied
  regardless since 6→6). File grew from 74 to 81 lines (+7) rather than shrinking, because the
  extracted helper's own signature and its `.map`/`.forEach` structure cost more lines than the
  ~12 duplicated lines it replaced in each of the two call sites combined; recorded as a measured
  discrepancy against the plan's "file is shorter" prediction, same shape as 05-05's
  `magic-textarea.tsx` growth. The finding itself is confirmed cleared by the scoped rescan
  regardless.
- `src/services/notifications/common.ts` — the three notification loaders (`shareNotificationsLoader$`,
  `socialNotificationsLoader$`, `zapNotificationsLoader$`) now share one internal
  `createNotificationsLoader(getFilters)` factory that composes the
  `combineLatest([accounts.active$, inboxes$]).pipe(map(...), shareReplay(1))` pipeline; each
  loader calls the factory with its own pubkey-to-filter-array builder. Exported names, types
  (`Observable<TimelineLoader | null>`) and replay semantics preserved — each of the three
  exported consts is still an independent call to the factory, so each still gets its own
  `shareReplay(1)`-backed single timeline; no state is shared across the three loaders. All
  filter kinds/tag selectors carried over verbatim, including the social loader's second filter
  over the user's own authored notes and its explanatory comment (confirmed via grep). Export
  count unchanged (8 → 8, factory not exported). File shrank from 148 to 105 lines (-43, the
  largest reduction of the three files). **Discrepancy from the plan's literal acceptance
  criterion:** the plan's wording asked for "the number of `shareReplay(1)` occurrences in the
  file" to be unchanged; consolidating the three identical `shareReplay(1)` call sites into the
  shared factory necessarily reduces the *textual* occurrence count from 4 to 2 (3 loaders + the
  unrelated `userEvents$` observable, now 1 factory-owned occurrence + `userEvents$`). This is the
  correct outcome of following the plan's own action text ("Extract one internal factory ... and
  returns the composed observable. Define the three exported loaders by calling it"), which
  necessarily consolidates the operator textually while preserving it functionally per loader —
  recorded here as a measured discrepancy (D-03) rather than silently claimed as passing; the
  actual T-05-19 concern (no shared/duplicated subscription across loaders) is unaffected since
  each factory call produces an independent pipeline.
- `src/views/messages/chat/components/direct-message-form.tsx` — all four relay-list blocks in
  `MessageTypeToggleButton`'s message-type modal (NIP-17 self/other inboxes, NIP-04 self/other
  inboxes) now share one internal `RelayListSection({ label, relays, emptyState })` component,
  referenced 4 times. `label` and `emptyState` are accepted as `ReactNode` rather than strings,
  since two of the four labels embed `<UserName pubkey={pubkey} />` and the NIP-17-self block's
  empty state is a distinct warning `Alert` with a link to `/settings/messages` (not a plain
  muted sentence like the other three) — extracting it as a node rather than forcing a
  string+boolean-flag shape kept the abstraction free of the config-flag smell D-05 warns
  against. Both messaging branches (private NIP-17 / legacy NIP-04) are untouched: the legacy
  privacy warning `Alert`, both branches' explanatory copy, and all three NIP spec links
  (`17.md`, `04.md`, `65.md`) confirmed present via grep. No new file created under
  `src/views/messages/chat/components/`. The encrypted-message send path (`SendMessageForm`,
  `sendMessage`, the `SendLegacyMessage`/`SendWrappedMessage` action calls, relay/inbox
  resolution) was not touched — only the relay-list *rendering* leaf inside the settings modal
  was factored, per the plan's explicit conservative-treatment instruction for this file. One
  new duplicate-block finding was transiently introduced mid-task (the two NIP-04 blocks'
  identical `"No NIP-65 inboxes configured."` empty-state text, now both passed as props to
  otherwise-differing `RelayListSection` calls) and fixed in the same task by hoisting the
  shared empty-state node into one local `nip65EmptyState` constant reused by both NIP-04 call
  sites (Rule 1 — bug/regression introduced by this task's own edit, fixed before commit). File
  grew from 430 to 431 lines (+1) rather than shrinking — the new component's own prop-type
  block and the hoisted `nip65EmptyState` constant cost slightly more lines than the four
  verbose blocks' combined savings; recorded as a measured discrepancy against the plan's "file
  is shorter" prediction, same shape as 05-05's `magic-textarea.tsx` and this plan's own
  `error-logger.ts` growth. The finding itself is confirmed cleared by the scoped rescan
  regardless.

No consumer of any of the three files' exports required editing; `pnpm build` (typecheck +
bundle) passed after every task. None of the three UI/behavioural surfaces touched here (error
log console rendering, the three notification timeline loaders, the messaging settings modal's
relay lists and message-type switch) were manually exercised in a running browser or dev server —
no test runner exists until 05-13 and `pnpm build` only typechecks/bundles; each is recorded as
an explicit OUTSTANDING manual-verification item in `05-06-SUMMARY.md`, not assumed verified.

## 05-07 D-12 useWebxdc extraction resolution (measured, not assumed)

Live rescan after 05-07 confirms the plan's predicted 1-row reduction exactly:
`complexity/function-too-long` 5 → 4 (-1), bucket-H total 7 → 6. `src/hooks/use-webxdc.ts`
confirmed via the full-repo `--json` rescan's per-finding `filePath` field to carry 0 findings
across all four bucket-H rules after the edit, down from the single 234-line `useWebxdc`
finding recorded in the per-finding table above.

- `useWebxdc` is now composed from two focused sub-hooks. `useWebxdcStateUpdates` owns the
  persistent kind 4932 subscription's downstream delivery: it wraps a further-split
  `useWebxdcCollectedUpdates` (subscription effect + serial-numbering memo, touching only
  `stateEvents`) and itself owns `listenerRef`/`lastSerialRef`, the delivery effect, the
  `setUpdateListener` setter and the `getAllUpdates` getter — the setter and the delivery
  effect stay together as required, since both read and write the two refs.
  `useWebxdcRealtimeChannel` owns the realtime channel joiner and the unmount cleanup effect
  together, since both read and write `realtimeActiveRef`/`realtimeAbortRef`.
- **The sixth callback:** CONTEXT.md's D-12 breakdown of this hook names five callbacks, but
  the file has six — the realtime channel joiner (`joinRealtimeChannel`) is a 68-line callback,
  the largest of the six, and was missing from that list. It is grouped with the unmount
  cleanup effect in `useWebxdcRealtimeChannel` because the two share
  `realtimeActiveRef`/`realtimeAbortRef`; splitting them would leave a ref written in one
  sub-hook and read in another. This is recorded here as a documentation correction to
  CONTEXT.md's breakdown, not promoted to the backlog under D-18, since it is not a latent bug.
- **A further split beyond the plan's named two sub-hooks:** after the two-sub-hook division,
  `useWebxdcStateUpdates` (subscription effect + memo + delivery effect + setter + getter, all
  in one function) still measured 91 lines, 11 over the 80-line plain-function budget — a
  division that merely relocated the finding rather than clearing it. Per Task 2's explicit
  instruction to split the offending sub-hook further along its own internal seam rather than
  reach for an ignore (D-12 does not permit an ignore-with-reason disposition for a hook), it
  was split again into `useWebxdcCollectedUpdates` (the subscription effect and its
  serial-numbering memo, owning only `stateEvents`) and `useWebxdcStateUpdates` (now just the
  refs, delivery effect, setter and getter, calling the collected-updates hook for its `updates`
  array). Neither resulting function exceeds the budget, and ref ownership is unaffected by this
  further split — `listenerRef`/`lastSerialRef` are still confined to `useWebxdcStateUpdates`
  alone. `useWebxdcRealtimeChannel` measured under budget on the first division and needed no
  further split.
- Ref ownership confirmed by direct grep, not assumed: `realtimeActiveRef`/`realtimeAbortRef`
  appear only within `useWebxdcRealtimeChannel`'s body; `listenerRef`/`lastSerialRef` appear only
  within `useWebxdcStateUpdates`'s body.
- Public surface unchanged: the returned object still carries all ten members (`selfAddr`,
  `selfName`, `sendUpdateInterval`, `sendUpdateMaxSize`, `sendUpdate`, `setUpdateListener`,
  `getAllUpdates`, `sendToChat`, `importFiles`, `joinRealtimeChannel`); both the named export
  `useWebxdc` and the default export survive; export count from the file is unchanged (2); no
  new file was created under `src/hooks/`; both `WEBXDC_UPDATE_KIND` and `WEBXDC_REALTIME_KIND`
  are still used. No `aislop-ignore` directive was added to the file
  (`grep -c 'aislop-ignore'` returns 0).
- A transient `eslint/no-unused-vars` finding on a destructured but now-unused `updates` binding
  in the main hook (introduced mid-edit when the delivery/setter/getter logic moved into the
  sub-hook but the main hook still destructured `updates` from it) was caught by the per-edit
  hook and fixed in the same task by removing the unused destructure, before committing (Rule 1).
- `pnpm build` (typecheck + bundle) passed after both tasks. `pnpm lint:ci`'s `--changes` diff
  against `origin/next`'s merge-base reported zero `react-hooks/*` findings of any kind in
  `src/hooks/use-webxdc.ts`, both confirming no new rules-of-hooks/exhaustive-deps finding was
  introduced here and that this file carried none before the edit either — the five
  `react-hooks/exhaustive-deps` findings in that run all belong to other files already flagged
  in prior plans' summaries (`magic-textarea.tsx`, `direct-message-form.tsx`,
  `notifications/index.tsx`, `list-history-modal.tsx`), unrelated to this plan's scope.
  `src/components/webxdc/webxdc.tsx` was not touched, per its exclusion from this plan's
  `files_modified` (owned by 05-08).

No behavioural test coverage exists for this hook (no test runner until 05-13, and both
`build_command`/`test_command` in `.planning/config.json` are `pnpm build`, a typecheck+bundle
only). The webxdc realtime channel, persistent-update delivery, and listener registration
surfaces were NOT exercised against a live relay or a running hosted mini-app in this session —
this is recorded as an explicit OUTSTANDING manual-verification item in `05-07-SUMMARY.md`, not
assumed verified from the passing build.

## Scope note (D-02)

The phase is defined by the bucket, not by the ROADMAP's illustration of it. Of the 33 findings
above, the ROADMAP's Phase 5 entry (pre-correction) names only `helpers/nostr/torrents.ts`,
`providers/global/napplet-shell-provider.tsx`, `services/notifications/common.ts`,
`views/articles/components/article-reader.tsx`, `views/notifications/index.tsx`,
`views/settings/background-worker/cached-files-card.tsx`, `services/wallets.ts`,
`helpers/nostr/relay-stats.ts`, and `services/verify-event.ts` — accounting for 19 findings. The
remaining 14 are in scope on equal footing: 8 `duplicate-block` findings in
`code.tsx`/`youtube.tsx`/`magic-textarea.tsx`/`error-logger.ts`/`groups/index.tsx`/
`list-history-modal.tsx`/`direct-message-form.tsx`/`service-worker-status-card.tsx`, plus 6
`function-too-long` findings in `post-modal/index.tsx`/`webxdc.tsx`/`use-webxdc.ts`/
`poll-form.tsx`/`about.tsx`/`event-publisher/index.tsx`. None of these 14 are cleared with an
"out of scope" disposition; each carries the same real disposition bar as the named targets.

## Wave-order note (D-17)

Waves run **low-risk first, big splits last**:

- **Wave 1** — mechanical, near-zero-risk items: the D-06 `torrents.ts` file-level ignore, the
  D-13 dead-symbol deletions in `relay-stats.ts`, and the D-05 borderline ignores (the four
  coincidental-shape duplicate blocks plus the three oversized-page-component ignores).
- **Wave 2** — small extractions: the D-07 `useAsyncAction` conversions, `magic-textarea.tsx`,
  `direct-message-form.tsx`, `error-logger.ts`, `notifications/common.ts`, `article-reader.tsx`,
  `notifications/index.tsx`, and the `useWebxdc`/`post-modal`/`webxdc.tsx` extractions.
- **Wave 3 onward** — the vitest harness (D-15) and the two big splits (D-08 napplet-shell,
  D-10 wallets).

Rationale: the rescan/verification loop is proven on cheap, reversible changes before the risky
relocation work begins, and the vitest harness arrives once the D-08/D-10 splits have actually
produced module-private pure functions worth testing. Two orderings were explicitly rejected:
**risk-first** (Phase 3's D-02 ordering — lands the riskiest work before the verification loop is
proven) and **harness-first** (largely infeasible here — the functions worth testing are
module-private until the D-08/D-10 extraction happens).
