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
| `code-quality/duplicate-block` | 21 | 12 (05-02, 05-03) | -9 |
| `complexity/function-too-long` | 8 | 5 (05-03) | -3 |
| `complexity/file-too-large` | 2 | TBD | TBD |
| `ai-slop/thin-wrapper` | 2 | 0 (05-02) | -2 |
| **Total** | **33** | **19 so far (05-02, 05-03)** | **-14 so far** |

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
