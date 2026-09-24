---
phase: 05-refactor-oversized-files-long-functions-and-duplicated-block
plan: 03
subsystem: aislop-lint-triage
tags: [aislop, ignore-directives, duplicate-block, function-too-long, no-code-change]
dependency-graph:
  requires: []
  provides:
    - "Seven bucket-H findings dispositioned as justified ignores (D-05, D-12)"
    - "05-BASELINE.md D-19 table updated with measured after-counts through 05-03"
  affects:
    - src/components/content/links/code.tsx
    - src/components/content/links/youtube.tsx
    - src/views/groups/index.tsx
    - src/views/lists/components/list-history-modal.tsx
    - src/views/new/poll/poll-form.tsx
    - src/views/relays/relay/tabs/about.tsx
    - src/views/tools/event-publisher/index.tsx
tech-stack:
  added: []
  patterns:
    - "Rule-scoped aislop-ignore-file / aislop-ignore-next-line directives naming a single rule and ending in `-- reason`, per AGENTS.md 'Inline ignores'"
key-files:
  created: []
  modified:
    - src/components/content/links/code.tsx
    - src/components/content/links/youtube.tsx
    - src/views/groups/index.tsx
    - src/views/lists/components/list-history-modal.tsx
    - src/views/new/poll/poll-form.tsx
    - src/views/relays/relay/tabs/about.tsx
    - src/views/tools/event-publisher/index.tsx
    - .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md
decisions:
  - "Four borderline duplicate-block findings (code.tsx, youtube.tsx, groups/index.tsx, list-history-modal.tsx) cleared with file-level ignores because each file carries exactly one such finding, so file scope suppresses nothing else (D-05)"
  - "Three oversized page components (PollFormInner, RelayPage, EventPublisherPage) cleared with next-line ignores stating both halves of the D-12 bar: inherent flat JSX composition with no repeated sub-structure worth factoring, and no test coverage making a split unsafe (D-12)"
  - "None of the three page components were split; no shared embed abstraction was created for code.tsx/youtube.tsx, per the plan's explicit prohibitions"
metrics:
  duration: "~15 min"
  completed: "2026-09-24"
status: complete
---

# Phase 5 Plan 03: Justify seven bucket-H findings with rule-scoped ignores Summary

Added seven rule-scoped `aislop-ignore-*` directives — four file-level for coincidental-shape
duplicate blocks, three next-line for inherently-long page components — clearing 7 of bucket-H's
26 remaining findings with zero executable code changes.

## What was built

**Task 1 — four borderline duplicate blocks (D-05):** Added one `aislop-ignore-file
code-quality/duplicate-block -- <reason>` directive as the first line of each of:
`src/components/content/links/code.tsx`, `src/components/content/links/youtube.tsx`,
`src/views/groups/index.tsx`, `src/views/lists/components/list-history-modal.tsx`. Each reason
explains the specific coincidental-shape argument for that file (different embed hosts/aspect
ratios/iframe features for the two renderer files; independent ternary-chain arms for
`groups/index.tsx`; sibling row-variant tails for `list-history-modal.tsx`), matching the D-08
justification bar — not "out of scope" or "less bad than the others."

**Task 2 — three oversized page components (D-12):** Added one `aislop-ignore-next-line
complexity/function-too-long -- <reason>` directive immediately above each of `PollFormInner`
(`src/views/new/poll/poll-form.tsx`), `RelayPage` (`src/views/relays/relay/tabs/about.tsx`), and
`EventPublisherPage` (`src/views/tools/event-publisher/index.tsx`). Each reason states both halves
required by D-12: the body is a single flat page/form tree with no repeated sub-structure worth
extracting, and the view has no test coverage, so splitting it would risk a silent regression
nothing in the project would catch. None of the three components were split.

**05-BASELINE.md updated:** the D-19 per-rule After/Delta cells now read `code-quality/duplicate-
block` 21→12 (-9, cumulative with 05-02), `complexity/function-too-long` 8→5 (-3), bucket-H total
so far 33→19. A new "05-03 surviving-ignore rows" section lists all seven findings with their
exact in-file reason text. The pre-existing per-finding table rows written by 05-01/05-02 were
left byte-identical — only the summary table's After/Delta cells and a new section were added.

## Verification

- `pnpm build` exited 0 after every task.
- Live full-repo rescan (`pnpm exec aislop scan --json .`) confirmed the plan's prediction exactly:
  `code-quality/duplicate-block` 16 → 12, `complexity/function-too-long` 8 → 5, bucket-H total
  26 → 19 (matches the orchestrator's live-measured starting point from 05-02, not the plan's
  stale pre-05-02 prose).
- Each of the seven files carries exactly one `aislop-ignore-*` directive, confirmed by
  `grep -c 'aislop-ignore'` returning 1 per file, and each directive names its rule and ends with
  `-- reason`, confirmed by the rule-scoped grep pattern also returning 1 per file.
- `git diff --numstat` shows exactly 1 insertion / 0 deletions for all seven source files — zero
  executable code changed. No new files were created under `src/views/new/poll/`,
  `src/views/relays/relay/tabs/`, or `src/views/tools/event-publisher/`.
- No reason contains "out of scope" or "less bad" (`grep -ric` returned 0 for both phrases across
  all seven files).
- A scoped rescan confirmed no over-suppression: `youtube.tsx` still reports its 2 pre-existing
  `ai-slop/hardcoded-url` warnings and `list-history-modal.tsx` still reports its 2 pre-existing
  `react-hooks/exhaustive-deps` warnings, both unrelated to bucket-H and unchanged by this plan's
  edits (confirmed via full-repo `--json` scan, not the per-edit hook, which reported these lines
  as transiently "new" only because their line numbers shifted by one when the directive was
  inserted above them).

## Deviations from Plan

None — plan executed exactly as written. The per-edit aislop hook reported the four duplicate-
block and three function-too-long findings as still present or newly triggered immediately after
each Edit call; this was expected transient noise from line-number shifts and incremental-scan
caching, not a real regression. A full-repo `--json` rescan after each task confirmed 0 remaining
findings for the targeted rule in every targeted file, matching the plan's acceptance criteria.

## Self-Check: PASSED

- FOUND: src/components/content/links/code.tsx (directive present, 1 insertion)
- FOUND: src/components/content/links/youtube.tsx (directive present, 1 insertion)
- FOUND: src/views/groups/index.tsx (directive present, 1 insertion)
- FOUND: src/views/lists/components/list-history-modal.tsx (directive present, 1 insertion)
- FOUND: src/views/new/poll/poll-form.tsx (directive present, 1 insertion)
- FOUND: src/views/relays/relay/tabs/about.tsx (directive present, 1 insertion)
- FOUND: src/views/tools/event-publisher/index.tsx (directive present, 1 insertion)
- FOUND: .planning/phases/05-refactor-oversized-files-long-functions-and-duplicated-block/05-BASELINE.md updated
- FOUND commit 92969ccc8 (Task 1)
- FOUND commit 3b493784c (Task 2)
- FOUND commit 5f1916aa7 (05-BASELINE.md update)
