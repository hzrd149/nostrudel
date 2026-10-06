---
phase: 07-accessibility-pass-on-interactive-components
plan: 05
subsystem: ui
tags: [a11y, jsx-a11y, iframe-has-title, alt-text, webxdc]
requires: []
provides:
  - "Decorative identicon (alt empty) and titled SoundCloud and webxdc iframes"
affects: [07-BASELINE]
tech-stack:
  added: []
  patterns: ["iframe title as a visible attribute before the props spread"]
key-files:
  created: []
  modified:
    - src/components/user/user-avatar.tsx
    - src/components/content/links/music.tsx
    - src/components/webxdc/webxdc.tsx
    - src/views/webxdc/components/webxdc-player.tsx
key-decisions:
  - "Identicon gets alt empty, not a descriptive alt (D-09)"
  - "Webxdc defaults title to 'Webxdc app'; WebxdcPlayer threads getWebxdcName(event)"
requirements-completed: [D-09, D-14, D-16, D-17]
duration: 10min
completed: 2026-10-06
status: complete
---

# Phase 7 Plan 05: Iframe titles and decorative identicon Summary

Empty alt on the decorative identicon, `title="SoundCloud player"` on the SoundCloud embed, and the webxdc iframe titled with the app name from `getWebxdcName(event)` (fallback `Webxdc app`).

## Tasks

| Task | Commit | Files |
| ---- | ------ | ----- |
| 1. Identicon alt and SoundCloud title | d34f29255 | user-avatar.tsx, music.tsx |
| 2. Webxdc iframe title | 2c34ce26d | webxdc.tsx, webxdc-player.tsx |

## Verification

- `pnpm build` passed after each task.
- Full scan: jsx-a11y findings in the four files 3 -> 0. Other diagnostics: 3 in user-avatar/music and 12 in webxdc/webxdc-player (15 total), all pre-existing and unchanged.
- No `allow`, `sandbox`, `src`, `style` or `scrolling` attribute changed; no ignores added; the two `WebxdcPlayer` callers are untouched.

## Inherited error (not fixed)

`src/components/content/links/music.tsx` still carries the pre-existing error-severity `react-hooks/rules-of-hooks` finding (`useColorMode` after an early return in `renderSongDotLinkUrl`), owned by backlog 999.2. Left as is per plan. `next` pushes are not gated by `pnpm lint:ci`, but a future PR-branch cut will hit this error.

## Deviations from Plan

None in behavior. Prettier re-wrapped the `WebxdcIframe` forwardRef declaration (longer props type), so the task 2 diff on `webxdc-player.tsx` shows re-indentation of that block (25 insertions, 19 deletions); semantics are unchanged apart from the added `title`.

## Known Stubs

None.

## Threat Flags

None.

## Manual UAT left for /gsd-verify-work (D-15)

- In the browser accessibility tree, the SoundCloud embed iframe is named "SoundCloud player".
- A launched webxdc app's iframe carries the app's name (and "Webxdc app" for any caller that passes no title).
- The webxdc app still loads and runs.

## Self-Check: PASSED

Both commits exist (d34f29255, 2c34ce26d); all four modified files present.
