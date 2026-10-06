---
phase: 07-accessibility-pass-on-interactive-components
plan: 03
subsystem: accessibility
tags: [a11y, aria, datalist, autocomplete, jsx-a11y]
requires: []
provides:
  - relay URL input relying on native input+datalist combobox semantics
  - composer autocomplete items without invalid option role
affects:
  - src/components/relay-url-input.tsx
  - src/components/magic-textarea.tsx
tech-stack:
  added: []
  patterns: [native HTML semantics over hand-added ARIA]
key-files:
  created: []
  modified:
    - src/components/relay-url-input.tsx
    - src/components/magic-textarea.tsx
decisions:
  - "D-10: remove combobox role, aria-autocomplete, aria-expanded, listbox/option roles from relay URL input and datalist"
  - "D-11: remove option role from composer Item spans; keep aria-label and alt so library buttons stay named"
metrics:
  tasks: 2
  files: 2
  completed: 2026-10-06
status: complete
---

# Phase 7 Plan 03: Relay URL input and composer autocomplete ARIA Summary

Removed hand-added combobox/listbox/option ARIA from the relay URL input (native `input[list]` + `datalist` now supplies the semantics) and the invalid `role="option"` from composer autocomplete items nested inside react-textarea-autocomplete's `li > div[role=button]`.

## Commits

- `6dd24993a` fix(07-03): let the native datalist provide relay URL combobox semantics
- `27fe785e5` fix(07-03): drop the invalid option role from composer autocomplete items

## Results

- `pnpm build` passes after each task.
- Full aislop scan: 0 `jsx-a11y/*` findings in both files (11 -> 0), no ignores added.
- Pre-existing other diagnostics unchanged: relay-url-input 3 (1 `react/set-state-in-effect`, 2 `react-hooks/exhaustive-deps`), magic-textarea 4 (3 `react/refs`, 1 `react-hooks/exhaustive-deps`).
- prettier: relay-url-input unchanged; magic-textarea collapsed the multi-line emoji-character span onto one line.
- No logic lines changed in relay-url-input (normalizeValue, handleBlur, handleKeyDown, effect, srOnly Text untouched). Phase 6 aislop-ignore directive and NOTE comments in magic-textarea intact.

## Deviations from Plan

None. The plan executed as written. The scan JSON was written to the session scratchpad because `$TMPDIR` was unset in this environment.

## Manual UAT left for /gsd-verify-work (D-15)

- Relay URL input (settings relays, add relay) shows datalist suggestions, and Enter and blur still normalize to `wss://`.
- Composer `@ali` and `:smi` suggestions appear; arrow/Enter and click both insert; items show avatar, name and emoji as before.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- Both modified files exist; commits 6dd24993a and 27fe785e5 present in git log.
