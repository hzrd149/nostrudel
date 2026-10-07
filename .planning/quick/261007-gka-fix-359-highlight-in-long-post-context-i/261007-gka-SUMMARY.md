---
phase: quick-261007-gka
plan: 01
subsystem: ui
tags: [chakra-ui, highlight, nip-84, styling]
requires: []
provides:
  - "Highlighted span in kind 9802 highlight cards wraps instead of being clipped"
affects: [TimelineHighlight, EmbeddedHighlight]
tech-stack:
  added: []
  patterns: ["Override Chakra Mark __css defaults via Highlight styles (sx)"]
key-files:
  created: [.changeset/tidy-highlights-wrap.md]
  modified: [src/components/timeline/highlight.tsx]
key-decisions:
  - "whiteSpace: normal (not pre-wrap) to match the surrounding context text"
  - "overflowWrap: break-word so long unbreakable tokens such as URLs do not overflow the card"
requirements-completed: [QUICK-261007-GKA-359]
metrics:
  tasks: 1
  files: 2
  completed: 2026-10-07
status: complete
---

# Quick 261007-gka: Fix #359 highlight truncation Summary

Added `whiteSpace: "normal"`, `boxDecorationBreak: "clone"` and `overflowWrap: "break-word"` to `HIGHLIGHT_STYLES` so the highlighted span in `HighlightContent` wraps across lines (with per-fragment background, padding and radius) instead of running off the card edge.

## What changed
- `src/components/timeline/highlight.tsx`: three new keys plus a one-line why-comment in `HIGHLIGHT_STYLES`. Chakra's `Mark` sets `whiteSpace: nowrap` in `__css`; `Highlight` passes `styles` as `sx`, which overrides it.
- `.changeset/tidy-highlights-wrap.md`: patch changeset referencing #359.
- TimelineHighlight and EmbeddedHighlight both inherit the fix via `HighlightContent`.

## Commits
- ed7f954ed: fix(quick-261007-gka): wrap long highlights instead of clipping them (#359)

## Deviations from Plan
None.

## Verification
- prettier --check: pass
- `tsc --project tsconfig.json`: exit 0
- Outstanding: visual spot-check of a long highlight (e.g. the one from #359) in the timeline and as an embedded note was NOT performed.

## Known Stubs
None.

## Threat Flags
None.
