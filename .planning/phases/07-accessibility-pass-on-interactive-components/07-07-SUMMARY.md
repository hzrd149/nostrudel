---
phase: 07-accessibility-pass-on-interactive-components
plan: 07
subsystem: ui
tags: [a11y, chakra-ui, jsx-a11y, aislop, settings]
requires:
  - phase: 07-accessibility-pass-on-interactive-components
    provides: wave 1 plans 07-02..07-05
provides:
  - Wallet card select area is a native button with a sibling Remove button
  - Share-service datalist rendered from one SHARE_SERVICES array with the phase's single rule-scoped ignore
affects: [phase-08 const consolidation]
tech-stack:
  added: []
  patterns:
    - "Flex as=button for a select area with a sibling action button (no nested buttons)"
key-files:
  created: []
  modified:
    - src/views/settings/wallet/index.tsx
    - src/views/settings/privacy/index.tsx
key-decisions:
  - "Select area (not Card) is the button so the Remove IconButton is not nested in a button"
  - "SHARE_SERVICES stays inline in privacy/index.tsx; moving it to src/const.ts is Phase 8"
requirements-completed: [D-07, D-12, D-13, D-14, D-16, D-17]
status: complete
---

# Phase 7 Plan 07: Wallet card button and share-service datalist Summary

Wallet cards select through a native `Flex as="button"` with `aria-pressed`, with Remove as a sibling `IconButton`. The privacy share-service options render from one `SHARE_SERVICES` array behind the phase's single reasoned `aislop-ignore-next-line jsx-a11y/control-has-associated-label` directive.

## Tasks

| Task | Commit | Notes |
| ---- | ------ | ----- |
| 1. Wallet card native button | 9aed46b20 `fix(07-07)` | Card keeps only variant and borderColor; CardBody `p="0"`; button has `p="3"`; Remove has `alignSelf="center"` `mr="3"` and `onClick={onRemove}` (no stopPropagation) |
| 2. SHARE_SERVICES + ignore | 01bab98e6 `chore(07-07)` | Same four URLs in the same order; one `<option key={url} value={url} />` line |

## Verification

- `pnpm build` passed after each task.
- Full aislop scan: 0 diagnostics in both files; `grep -rnE 'aislop-ignore[a-z-]* jsx-a11y/' src` returns exactly 1 line (privacy).
- Prettier: wallet file passes; privacy file's only difference is the pre-existing 4-line reflow (`prettier --write` not run on it).
- No `role=`, `stopPropagation`, `font=`, `tabIndex`, or `onKeyDown` in wallet/index.tsx. `src/const.ts` untouched.

## Deviations from Plan

None - plan executed exactly as written.

## Manual UAT items for /gsd-verify-work (D-15)

- Tab reaches the wallet select button with a visible focus ring.
- Enter and Space select the wallet.
- Tab then reaches Remove; Remove does not select the wallet.
- Clicking anywhere on the card except Remove selects the wallet.
- Wallet cards look the same (border, padding, active `primary.500` border) in light and dark mode.
- The privacy Share service input shows the same four suggestions.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- src/views/settings/wallet/index.tsx and src/views/settings/privacy/index.tsx modified; commits 9aed46b20 and 01bab98e6 exist.
