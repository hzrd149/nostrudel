---
phase: 07-accessibility-pass-on-interactive-components
plan: 04
subsystem: ui
tags: [a11y, jsx-a11y, chakra-ui, native-elements]
requires: []
provides:
  - "Native article/section/ul/li/button elements in compact-note-content, loading-nostr-link, relay-icon-stack"
affects: [compact-note-content, loading-nostr-link, relay-icon-stack]
tech-stack:
  added: []
  patterns: ["Chakra as=ul/li with listStyleType none", "Chakra Flex as=button with inset _focusVisible ring"]
key-files:
  created: []
  modified:
    - src/components/compact-note-content.tsx
    - src/components/loading-nostr-link.tsx
    - src/components/relay-icon-stack.tsx
key-decisions:
  - "No explicit list role on the ul (re-triggers prefer-tag-over-role)"
  - "No hand-written keyboard handler on the relay stack button; PopoverTrigger clones onClick"
metrics:
  duration: ~10min
  completed: 2026-10-06
status: complete
---

# Phase 7 Plan 04: Shared cards and controls Summary

Compact note body, link details, relay filter list and relay icon stack now use native article, section, ul/li and button elements, clearing all 7 bucket-F jsx-a11y findings in the three files with no ignores.

## Tasks

| Task | Commit | Description |
| ---- | ------ | ----------- |
| 1 | fe26f0325 | `refactor(07-04)`: Box as article (compact note), Box as section (link details) |
| 2 | e1ecef553 | `fix(07-04)`: relay list as `ul` named Available relays with `li` wrappers, listitem role removed from toggle buttons (aria-pressed kept); Show More is plain bold text (no role, tabIndex, aria-label) |
| 3 | 1234cf3f2 | `fix(07-04)`: RelayIconStack Flex as native `button` type=button, transparent bg, p=0, inset focus-visible ring |

## Verification

- `pnpm build` passed after each task.
- After Task 1: 4 jsx-a11y findings left in the two files (as predicted); after Task 2: only the pre-existing `react/refs` (compact-note-content line 49) remains; after Task 3: 0 diagnostics in relay-icon-stack.tsx. Final scan: bucket-F in the three files 7 -> 0, other diagnostic count 1 (unchanged).
- Prettier unchanged on all touched files; grep acceptance checks for role/tabIndex removal and listStyleType count (2) passed.

## Deviations from Plan

None - plan executed exactly as written.

## Manual UAT left for /gsd-verify-work (D-15)

- RelayIconStack: Tab focus shows the inset ring; Enter, Space and click open the popover; `row-reverse` order unchanged on the user notes tab.
- Compact note "Show More" looks identical and is not a Tab stop.
- loading-nostr-link relay list shows full-width outlined buttons with no bullets, pressed buttons in the primary color.
- AX tree shows `list "Available relays"`, `region "Link details"`, and compact note `article "Note content"`.
- Light/dark and mobile/desktop parity.

## Known Stubs

None.

## Threat Flags

None. T-07-10 (type=button present), T-07-11 (PopoverTrigger handlers cloned onto button), T-07-12 (toggle expressions kept verbatim, key moved to li) mitigated as planned.

## Self-Check: PASSED

Files modified exist; commits fe26f0325, e1ecef553, 1234cf3f2 present in git log.
